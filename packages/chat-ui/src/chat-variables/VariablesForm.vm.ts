// VM: hydrate from server on success, or from schema defaults on error OR empty server {}.
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement,
} from '@jsonforms/core';
import { createAjv } from '@jsonforms/core';
import * as React from 'react';

import { useUpdateFlowRunVariable } from '@/domains/flowruns/mutations';
import { useFlowRunVariables } from '@/domains/flowruns/queries';

import { isDraftThreadId } from '@/shared/utils/threadId';

import { cells, renderers } from './renders/index';
import type { WorkspaceLike } from './types';

type VarsRecord = Record<
  string,
  { schema?: JsonSchema7; access?: 'Read' | 'Write' }
>;
// JsonSchema7 types draft-07 `definitions` only; the platform emits `$defs`.
type SchemaWithDefs = JsonSchema7 & { $defs?: Record<string, JsonSchema7> };
type VmParams = { workspace: WorkspaceLike; threadId: string };

/**
 * Past this many variables the action bar stops trying to hold them all: only
 * the ones worth reaching for mid-message stay inline (today, the model), and
 * the rest move behind the overflow pill. Three fits a phone-width bar without
 * wrapping, which is what made a variable-heavy workspace look messy.
 */
const MAX_INLINE_VARIABLES = 3;

/** The renderer for these is a pill, and picking a model mid-thread is common
 *  enough that it keeps its place in the bar however many variables there are. */
const isModelSelector = (schema: JsonSchema7) =>
  schema.title === 'ModelId' ||
  (schema as unknown as Record<string, unknown>)['x-model-selector'] === true;

// Layout helper types
type VerticalLayout = { type: 'VerticalLayout'; elements: UISchemaElement[] };
type HorizontalLayout = {
  type: 'HorizontalLayout';
  elements: UISchemaElement[];
  options?: Record<string, unknown>;
};

interface ChatVariablesFormVm {
  schema: JsonSchema7;
  /** The controls that stay in the action bar, or null when none do. */
  inlineUiSchema: UISchemaElement | null;
  /** The controls behind the overflow pill, or null when nothing overflows. */
  overflowUiSchema: UISchemaElement | null;
  /** How many controls `overflowUiSchema` holds. */
  overflowCount: number;
  data: Record<string, unknown> | null;
  renderers: typeof renderers;
  cells: typeof cells;
  ajv: ReturnType<typeof createAjv>;
  onChange: (args: { data: Record<string, unknown> }) => void;
  config: {
    restrict: boolean;
    trim: boolean;
    showUnfocusedDescription: boolean;
    hideRequiredAsterisk: boolean;
    dense: boolean;
    minRows: number;
    maxRows: number;
  };
  isLoading: boolean;
  isReady: boolean;
  isHydrated: boolean;
}

/** One row of controls, laid out by our grid renderer. */
function rowLayout(controls: ControlElement[]): UISchemaElement {
  const innerRow: HorizontalLayout = {
    type: 'HorizontalLayout',
    elements: controls as unknown as UISchemaElement[],
    options: { gap: '12px', alignItems: 'flex-start' },
  };

  const ui: VerticalLayout = {
    type: 'VerticalLayout',
    elements: [innerRow as unknown as UISchemaElement],
  };

  return ui as unknown as UISchemaElement;
}

function buildSimpleSchemaAndUi(
  vars: VarsRecord | undefined,
  threadVars: Record<string, unknown> | undefined,
  useDefaults: boolean
): {
  schema: JsonSchema7;
  inlineControls: ControlElement[];
  overflowControls: ControlElement[];
  initialData: Record<string, unknown>;
} {
  const names = Object.keys(vars || {});

  const properties: Record<string, JsonSchema7> = {};
  const controls: ControlElement[] = [];
  const inlineOnly: ControlElement[] = [];
  const initialData: Record<string, unknown> = {};
  // Each variable schema arrives self-contained (Pydantic-style: its own
  // `$defs` + `#/$defs/X` refs). Nested under `properties`, those refs would
  // resolve against the composed root, so hoist every `$defs` up to it.
  const $defs: Record<string, JsonSchema7> = {};

  for (const name of names) {
    const cfg = vars?.[name] || {};
    const { $defs: varDefs, ...s } = (cfg.schema || {}) as SchemaWithDefs;
    if (varDefs) Object.assign($defs, varDefs);
    properties[name] = s;

    const hasServerKey =
      threadVars !== undefined &&
      Object.prototype.hasOwnProperty.call(threadVars, name);

    const val = hasServerKey
      ? threadVars?.[name]
      : useDefaults
      ? (s as unknown as { default?: unknown }).default
      : undefined;

    initialData[name] = val;

    const control: ControlElement = {
      type: 'Control',
      scope: `#/properties/${name}`,
    };
    if (cfg.access === 'Read') {
      (properties[name] as unknown as { readOnly?: boolean }).readOnly = true;
      (control as unknown as { enabled?: boolean }).enabled = false;
    }
    controls.push(control);
    if (isModelSelector(properties[name])) inlineOnly.push(control);
  }

  const schema: SchemaWithDefs = { type: 'object', properties };
  if (Object.keys($defs).length > 0) schema.$defs = $defs;

  // Few enough to read at a glance: leave them all in the bar.
  if (controls.length <= MAX_INLINE_VARIABLES) {
    return {
      schema,
      inlineControls: controls,
      overflowControls: [],
      initialData,
    };
  }

  return {
    schema,
    inlineControls: inlineOnly,
    overflowControls: controls.filter((c) => !inlineOnly.includes(c)),
    initialData,
  };
}

export function useChatVariablesFormVm({
  workspace,
  threadId,
  setVariables,
}: VmParams & {
  setVariables: (variables: Record<string, unknown>) => void;
}): ChatVariablesFormVm {
  const {
    data: threadVars,
    isLoading,
    isError,
  } = useFlowRunVariables(threadId);
  const { mutate: updateVariableMutation } = useUpdateFlowRunVariable();
  const querySettled = !isLoading && (threadVars !== undefined || isError);

  // use defaults if error OR server returned {}
  const shouldUseDefaults =
    isError || (threadVars && Object.keys(threadVars).length === 0);

  const built = React.useMemo(() => {
    return buildSimpleSchemaAndUi(
      workspace.variables as VarsRecord,
      threadVars,
      shouldUseDefaults ?? false
    );
  }, [workspace.variables, threadVars, shouldUseDefaults]);

  const [data, setData] = React.useState<Record<string, unknown> | null>(null);

  React.useEffect(() => {
    if (querySettled) {
      setData(built.initialData);
      setVariables(built.initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [querySettled, built.initialData, setVariables]);

  const ajv = React.useMemo(() => createAjv({ useDefaults: false }), []);

  const prevRef = React.useRef<Record<string, unknown> | null>(null);
  React.useEffect(() => {
    prevRef.current = data;
  }, [data]);

  const onChange = React.useCallback(
    ({ data: next }: { data: Record<string, unknown> }) => {
      if (prevRef.current && !isDraftThreadId(threadId)) {
        const keys = Object.keys((workspace.variables as VarsRecord) || {});
        for (const k of keys) {
          const before = prevRef.current?.[k];
          const after = next?.[k];
          if (before !== after) {
            updateVariableMutation({
              flowRunId: threadId,
              variableName: k,
              value: after,
            });
          }
        }
      }
      setData(next);
      setVariables(next);
    },
    [workspace.variables, setVariables, updateVariableMutation, threadId]
  );

  const config = React.useMemo(
    () => ({
      restrict: true,
      trim: false,
      showUnfocusedDescription: true,
      hideRequiredAsterisk: true,
      // These are settings, not the message being written: text fields start at
      // one line and grow, on the smaller of the renderers' two scales, so a
      // panel of them stays a list rather than a column of blocks.
      dense: true,
      minRows: 1,
      maxRows: 6,
    }),
    []
  );

  const inlineUiSchema = React.useMemo(
    () =>
      built.inlineControls.length ? rowLayout(built.inlineControls) : null,
    [built.inlineControls]
  );
  const overflowUiSchema = React.useMemo(
    () =>
      built.overflowControls.length ? rowLayout(built.overflowControls) : null,
    [built.overflowControls]
  );

  return {
    schema: built.schema,
    inlineUiSchema,
    overflowUiSchema,
    overflowCount: built.overflowControls.length,
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
