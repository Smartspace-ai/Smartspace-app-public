'use client';
import { JsonForms } from '@jsonforms/react';
import { Loader2 } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';

import { ChatVariablesFormProps, ChatVariablesFormRef } from './types';
import { useChatVariablesFormVm } from './VariablesForm.vm';

export const ChatVariablesForm = forwardRef<ChatVariablesFormRef, ChatVariablesFormProps>(
  ({ workspace, threadId }, ref) => {
    const vm = useChatVariablesFormVm({ workspace, threadId });

    useImperativeHandle(ref, () => ({
      hasChanges: () => false, // minimal version: not tracking deltas here
      getChangedVariables: () => ({}),
      getCurrentVariables: () => vm.data ?? {},
      saveChangedVariables: async () => {
        // minimal placeholder
        // eslint-disable-next-line no-console
        console.log('saveChangedVariables');
      },
    }));

    // No variables → no form
    if (!workspace.variables || Object.keys(workspace.variables).length === 0) return null;

    // Gate rendering until VM hydrated (threadVars loaded AND data set)
    if (!vm.isHydrated) {
      return (
        <div className="flex justify-center items-center w-full h-8">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      );
    }

    // Safe to log now — vm.data is hydrated
    // console.log('vm.schema', vm.schema);
    // console.log('vm.uiSchema', vm.uiSchema);
    // console.log('vm.data', vm.data);
    // console.log('vm.renderers', vm.renderers, vm.cells, vm.ajv, vm.config);

    return (
      <div className="w-full">
        <JsonForms
          schema={vm.schema}
          uischema={vm.uiSchema}
          data={vm.data}
          renderers={vm.renderers}
          cells={vm.cells}
          ajv={vm.ajv}
          onChange={vm.onChange}
          config={vm.config}
        />
      </div>
    );
  }
);
