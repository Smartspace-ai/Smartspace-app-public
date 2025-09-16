'use client';
import { createAjv } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { Loader2 } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';

import { cells, renderers } from './renders/index';
import { ChatVariablesFormProps, ChatVariablesFormRef } from './types';
import { useChatVariablesFormVm } from './VariablesForm.vm';

export const ChatVariablesForm = forwardRef<ChatVariablesFormRef, ChatVariablesFormProps>(
  ({ workspace, threadId }, ref) => {
    const vm = useChatVariablesFormVm({ workspace, threadId });
    
    // Create AJV instance with useDefaults enabled to automatically apply schema defaults
    const ajv = createAjv({ useDefaults: true });

    useImperativeHandle(ref, () => ({
      hasChanges: vm.hasChanges,
      getChangedVariables: vm.changedVariables,
      getCurrentVariables: vm.currentVariables,
      saveChangedVariables: vm.save,
    }));

    if (!workspace.variables || Object.keys(workspace.variables).length === 0) return null;

    if (vm.isLoading) {
      return (
        <div className="flex justify-center items-center w-full h-8">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="w-full">
        <JsonForms
          schema={vm.schema}
          uischema={vm.uiSchema}
          data={vm.formData}
          renderers={renderers}
          cells={cells}
          ajv={ajv}
          onChange={({ data }) => vm.setFormData(data)}
          config={{ restrict: true, trim: false, showUnfocusedDescription: true, hideRequiredAsterisk: true }}
        />
      </div>
    );
  }
);
