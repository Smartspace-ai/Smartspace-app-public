'use client';
import { JsonForms } from '@jsonforms/react';
import { Loader2 } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';

import { ChatVariablesFormProps, ChatVariablesFormRef } from './types';
import { useChatVariablesFormVm } from './VariablesForm.vm';

import './VariablesForm.css'; // 👈 import the CSS overrides

export const ChatVariablesForm = forwardRef<ChatVariablesFormRef, ChatVariablesFormProps>(
  ({ workspace, threadId }, ref) => {
    const vm = useChatVariablesFormVm({ workspace, threadId });

    useImperativeHandle(ref, () => ({
      hasChanges: () => false,
      getChangedVariables: () => ({}),
      getCurrentVariables: () => vm.data ?? {},
      saveChangedVariables: async () => {
        // minimal placeholder
        // eslint-disable-next-line no-console
        console.log('saveChangedVariables');
      },
    }));

    if (!workspace.variables || Object.keys(workspace.variables).length === 0) return null;

    if (!vm.isHydrated) {
      return (
        <div className="flex justify-center items-center w-full h-8">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="w-full jsonforms-compact">
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
