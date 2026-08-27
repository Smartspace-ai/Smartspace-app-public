import { JsonForms } from '@jsonforms/react';
import { Loader2 } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';

import { ChatVariablesFormProps, ChatVariablesFormRef } from './types';
import { useChatVariablesFormVm } from './VariablesForm.vm';
import { VariablesOverflowPanel } from './VariablesOverflow';

import './VariablesForm.css'; // 👈 import the CSS overrides

export const ChatVariablesForm = forwardRef<
  ChatVariablesFormRef,
  ChatVariablesFormProps & {
    setVariables: (variables: Record<string, unknown>) => void;
  }
>(({ workspace, threadId, setVariables }, ref) => {
  const vm = useChatVariablesFormVm({ workspace, threadId, setVariables });

  useImperativeHandle(ref, () => ({
    hasChanges: () => false,
    getChangedVariables: () => ({}),
    getCurrentVariables: () => vm.data ?? {},
    saveChangedVariables: async () => {
      return;
    },
  }));

  if (!workspace.variables || Object.keys(workspace.variables).length === 0)
    return null;

  if (!vm.isHydrated) {
    return (
      <div className="flex justify-center items-center w-full h-8">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }

  // Both forms hold the same schema and the same data, so an edit in either
  // reports the whole object back — they are two views of one form, split so a
  // workspace with a dozen variables doesn't fill the action bar with them.
  const formProps = {
    schema: vm.schema,
    data: vm.data,
    renderers: vm.renderers,
    cells: vm.cells,
    ajv: vm.ajv,
    onChange: vm.onChange,
  };

  return (
    <div className="flex w-full min-w-0 items-center gap-1">
      {vm.inlineUiSchema && (
        <div className="min-w-0 jsonforms-compact">
          {/* Same form, two surfaces: capsules in the bar, a settings list in
              the panel. Each renderer reads that off the config. */}
          <JsonForms
            {...formProps}
            uischema={vm.inlineUiSchema}
            config={vm.barConfig}
          />
        </div>
      )}

      {vm.overflowUiSchema && (
        <VariablesOverflowPanel count={vm.overflowCount}>
          <div className="jsonforms-compact">
            <JsonForms
              {...formProps}
              uischema={vm.overflowUiSchema}
              config={vm.panelConfig}
            />
          </div>
        </VariablesOverflowPanel>
      )}
    </div>
  );
});
