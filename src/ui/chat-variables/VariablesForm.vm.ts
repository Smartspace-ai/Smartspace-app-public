// VM: hydrate from server on success, or from schema defaults on error OR empty server {}.
import type { ControlElement, JsonSchema7, UISchemaElement } from '@jsonforms/core';
import { createAjv } from '@jsonforms/core';
import * as React from 'react';

import { useUpdateVariable } from '@/domains/variables/mutations';
import { useThreadVariables } from '@/domains/variables/queries';
import { cells, renderers } from './renders/index';
import type { WorkspaceLike } from './types';

type VarsRecord = Record<string, { schema?: JsonSchema7; access?: 'Read' | 'Write' }>;
type VmParams = { workspace: WorkspaceLike; threadId: string };

// Layout helper types
type VerticalLayout = { type: 'VerticalLayout'; elements: UISchemaElement[] };
type HorizontalLayout = { type: 'HorizontalLayout'; elements: UISchemaElement[]; options?: any };

interface ChatVariablesFormVm {
  schema: JsonSchema7;
  uiSchema: UISchemaElement;
  data: Record<string, any> | null;
  renderers: typeof renderers;
  cells: typeof cells;
  ajv: any;
  onChange: (args: { data: Record<string, any> }) => void;
  config: {
    restrict: boolean;
    trim: boolean;
    showUnfocusedDescription: boolean;
    hideRequiredAsterisk: boolean;
  };
  isLoading: boolean;
  isReady: boolean;
  isHydrated: boolean;
}

function buildSimpleSchemaAndUi(
  vars: VarsRecord | undefined,
  threadVars: Record<string, any> | undefined,
  useDefaults: boolean
): { schema: JsonSchema7; uiSchema: UISchemaElement; initialData: Record<string, any> } {
  const names = Object.keys(vars || {});

  const properties: Record<string, JsonSchema7> = {};
  const controls: ControlElement[] = [];
  const initialData: Record<string, any> = {};

  for (const name of names) {
    const cfg = vars![name] || {};
    const s = (cfg.schema || {}) as JsonSchema7;
    properties[name] = s;

    const hasServerKey =
      threadVars !== undefined && Object.prototype.hasOwnProperty.call(threadVars, name);

    const val = hasServerKey
      ? threadVars![name]
      : useDefaults
      ? (s as any).default
      : undefined;

    initialData[name] = val;

    const control: ControlElement = { type: 'Control', scope: `#/properties/${name}` };
    if (cfg.access === 'Read') {
      (properties[name] as any).readOnly = true;
      (control as any).enabled = false;
    }
    controls.push(control);
  }

  const schema: JsonSchema7 = { type: 'object', properties };

  const innerRow: HorizontalLayout = {
    type: 'HorizontalLayout',
    elements: controls as unknown as UISchemaElement[],
    options: { gap: '12px', alignItems: 'flex-start' },
  };

  const ui: VerticalLayout = {
    type: 'VerticalLayout',
    elements: [innerRow as unknown as UISchemaElement],
  };

  return { schema, uiSchema: ui as unknown as UISchemaElement, initialData };
}

export function useChatVariablesFormVm({ workspace, threadId }: VmParams): ChatVariablesFormVm {
  const { data: threadVars, isLoading, isError } = useThreadVariables(threadId);
  const { mutate: updateVariableMutation } = useUpdateVariable(threadId)
  const querySettled = !isLoading && (threadVars !== undefined || isError);

  // use defaults if error OR server returned {}
  const shouldUseDefaults = isError || (threadVars && Object.keys(threadVars).length === 0);

  const built = React.useMemo(() => {
    return buildSimpleSchemaAndUi(
      workspace.variables as VarsRecord,
      threadVars,
      shouldUseDefaults ?? false
    );  
  }, [workspace.variables, threadVars, shouldUseDefaults]);

  const [data, setData] = React.useState<Record<string, any> | null>(null);

  React.useEffect(() => {
    if (querySettled) {
      setData(built.initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [querySettled, built.initialData]);

  const ajv = React.useMemo(() => createAjv({ useDefaults: false }) as any, []);

  const prevRef = React.useRef<Record<string, any> | null>(null);
  React.useEffect(() => {
    prevRef.current = data;
  }, [data]);

  const onChange = React.useCallback(
    ({ data: next }: { data: Record<string, any> }) => {
      if (prevRef.current) {
        const keys = Object.keys((workspace.variables as VarsRecord) || {});
        for (const k of keys) {
          const before = prevRef.current?.[k];
          const after = next?.[k];
          if (before !== after) {
            updateVariableMutation({ threadId, variableName: k, value: after })
          }
        }
      }
      setData(next);
    },
    [workspace.variables]
  );

  const config = React.useMemo(
    () => ({
      restrict: true,
      trim: false,
      showUnfocusedDescription: true,
      hideRequiredAsterisk: true,
    }),
    []
  );

  return {
    schema: built.schema,
    uiSchema: built.uiSchema,
    data,
    renderers,
    cells,
    ajv,
    onChange,
    config,
    isLoading,
    isReady: querySettled,
    isHydrated: data !== null,
  };
}
