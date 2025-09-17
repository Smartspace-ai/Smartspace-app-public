// src/ui/chat-variables/vm/useChatVariablesFormVm.ts
import { useUpdateVariable } from '@/domains/variables/mutations';
import { useThreadVariables } from '@/domains/variables/queries';
import * as React from 'react';
import { WorkspaceLike } from './types';
import { getChangedVariables, getCurrentVariables, hasAnyChanges } from './utils/diff';
import { isSinglePropObjectSchema, rewrapValueIfNeeded, unwrapInitialValue } from './utils/flatten';

type VmParams = {
  workspace: WorkspaceLike;
  threadId: string;
};

export function useChatVariablesFormVm({ workspace, threadId }: VmParams) {
  const { data: threadVars, isLoading } = useThreadVariables(threadId);
  const updateVariable = useUpdateVariable(threadId);

  // Build JSON schema + UI schema + initial data (memoized)
  const { schema, uiSchema, initialData } = React.useMemo(() => {
    const vars = workspace.variables || {};
    const names = Object.keys(vars);

    if (!names.length) {
      return {
        schema: { type: 'object', properties: {} },
        uiSchema: { type: 'VerticalLayout', elements: [] },
        initialData: {},
      };
    }

    const properties: Record<string, any> = {};
    const uiEls: Record<string, any> = {};
    const init: Record<string, any> = {};

    const compact: string[] = [];
    const full: string[] = [];

    for (const name of names) {
      const cfg = vars[name];
      let effectiveSchema = cfg.schema;

      if (isSinglePropObjectSchema(effectiveSchema)) {
        const k = Object.keys(effectiveSchema.properties)[0]!;
        const inner = effectiveSchema.properties[k];
        effectiveSchema = { ...inner };
        if (!effectiveSchema.title) effectiveSchema.title = name;
      }

      properties[name] = effectiveSchema;

      const raw = threadVars?.[name] ?? effectiveSchema?.default;
      init[name] = unwrapInitialValue(effectiveSchema, raw);

      const ui: any = {};
      if (cfg.access === 'Read') {
        ui['ui:readonly'] = true;
        ui['readOnly'] = true;
        ui['enabled'] = false; // Explicitly disable the field for read-only access
        ui['access'] = 'Read'; // Pass access level to uischema for renderer checks
      }
      if (effectiveSchema?.title === 'ModelId') ui.label = 'Model';
      if (Object.keys(ui).length) uiEls[name] = ui;

      const isModel = effectiveSchema?.['x-model-selector'] || effectiveSchema?.title === 'ModelId';
      const isCompact =
        effectiveSchema?.type === 'boolean' ||
        !!effectiveSchema?.enum || !!effectiveSchema?.oneOf || !!effectiveSchema?.anyOf ||
        effectiveSchema?.format === 'uuid' ||
        (effectiveSchema?.type === 'number' && !effectiveSchema?.multipleOf) ||
        (effectiveSchema?.type === 'string' && effectiveSchema?.maxLength && effectiveSchema.maxLength <= 50);

      (isModel || isCompact ? compact : full).push(name);
    }

    const elements: any[] = [
      ...full.map((n) => ({ type: 'Control', scope: `#/properties/${n}`, ...(uiEls[n] || {}) })),
    ];
    if (compact.length) {
      elements.push({
        type: 'HorizontalLayout',
        elements: compact.map((n) => ({ type: 'Control', scope: `#/properties/${n}`, ...(uiEls[n] || {}) })),
        options: { gap: '12px', alignItems: 'flex-start' },
      });
    }

    return {
      schema: { type: 'object', properties },
      uiSchema: { type: 'VerticalLayout', elements },
      initialData: init,
    };
  }, [workspace.variables, threadVars]);

  // Local form state + snapshot for diffs
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [originalData, setOriginalData] = React.useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const previousFormDataRef = React.useRef<Record<string, any>>({});

  React.useEffect(() => {
    if (!isLoading) {
      // Always update form data when initialData changes (e.g., when threadVars loads)
      setFormData(initialData);
      setOriginalData(initialData);
      previousFormDataRef.current = initialData;
    }
  }, [isLoading, initialData]); // eslint-disable-line

  // Public VM API
  const hasChanges = React.useCallback(
    () => hasAnyChanges(workspace, originalData, formData),
    [workspace, originalData, formData]
  );

  const currentVariables = React.useCallback(
    () => getCurrentVariables(workspace, formData),
    [workspace, formData]
  );

  const changedVariables = React.useCallback(
    () => getChangedVariables(workspace, originalData, formData),
    [workspace, originalData, formData]
  );

  const save = React.useCallback(async () => {
    if (isSaving) return; // Prevent concurrent saves
    
    setIsSaving(true);
    try {
      const changed = changedVariables();
      for (const [name, value] of Object.entries(changed)) {
        const access = workspace.variables?.[name]?.access;
        if (access === 'Write') {
          // value is already rewrapped by getChangedVariables
          await updateVariable.mutateAsync({ threadId, variableName: name, value });
        }
      }
      setOriginalData({ ...formData });
    } finally {
      setIsSaving(false);
    }
  }, [changedVariables, workspace.variables, updateVariable, threadId, formData, isSaving]);

  // Custom setFormData that triggers auto-save
  const setFormDataWithAutoSave = React.useCallback((newData: Record<string, any>) => {
    setFormData(newData);
    
    // Auto-save with debouncing
    if (!isLoading && !isSaving && Object.keys(newData).length > 0) {
      setTimeout(async () => {
        const hasChangesNow = hasAnyChanges(workspace, originalData, newData);
        if (hasChangesNow) {
          setIsSaving(true);
          try {
            const changed = getChangedVariables(workspace, originalData, newData);
            for (const [name, value] of Object.entries(changed)) {
              const access = workspace.variables?.[name]?.access;
              if (access === 'Write') {
                await updateVariable.mutateAsync({ threadId, variableName: name, value });
              }
            }
            setOriginalData({ ...newData });
          } catch (error) {
            console.error('Auto-save failed:', error);
          } finally {
            setIsSaving(false);
          }
        }
      }, 500);
    }
  }, [isLoading, isSaving, workspace, originalData, updateVariable, threadId]);

  // If you ever need to rewrap everything (not just changes), use currentVariables()
  const rewrapAllForSubmit = React.useCallback(() => {
    const result: Record<string, any> = {};
    for (const [name, val] of Object.entries(formData)) {
      result[name] = rewrapValueIfNeeded(workspace.variables?.[name]?.schema, val);
    }
    return result;
  }, [formData, workspace.variables]);

  return {
    // data for JSONForms
    schema,
    uiSchema,
    formData,
    setFormData: setFormDataWithAutoSave,
    isLoading,

    // commands
    save,
    hasChanges,
    currentVariables,
    changedVariables,
    rewrapAllForSubmit,
  };
}
