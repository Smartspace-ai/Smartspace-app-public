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

    // AJV with defaults enabled (matches your previous behavior)
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
        {/* === Restored inline layout CSS (identical rules) === */}
        <style>{`
          /* Only target the horizontal layout compact fields */
          .MuiGrid-container .MuiGrid-item {
            flex: 0 0 auto !important;
          }
          .MuiGrid-container {
            align-items: flex-start !important;
            justify-content: flex-start !important;
            text-align: left !important;
          }

          /* Specific sizing for compact fields in horizontal layout only */
          .MuiGrid-container .MuiAutocomplete-root {
            width: 280px !important;
            min-width: 200px !important;
          }

          .MuiGrid-container .MuiTextField-root[data-field-type="number"] {
            width: 120px !important;
            min-width: 100px !important;
          }

          .MuiGrid-container .MuiFormControlLabel-root {
            min-width: auto !important;
            margin-right: 16px !important;
          }

          /* Reduce spacing between variable rows */
          .MuiFormControl-root {
            margin-bottom: 4px !important;
            margin-top: 0 !important;
          }
          .jsonforms-vertical-layout > * {
            margin-bottom: 4px !important;
            margin-top: 0 !important;
          }

          /* Reduce overall form spacing */
          .jsonforms-control {
            padding-bottom: 2px !important;
            padding-top: 0 !important;
          }

          /* Reduce spacing on form groups and layouts */
          .MuiFormGroup-root {
            margin-bottom: 4px !important;
            margin-top: 0 !important;
          }

          /* Tighter spacing for the entire form container */
          .jsonforms-renderer-set > * {
            margin-bottom: 4px !important;
            margin-top: 0 !important;
          }

          /* Mobile tweaks */
          @media (max-width: 640px) {
            .jsonforms-control {
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }
            .MuiFormControl-root,
            .jsonforms-vertical-layout > *,
            .jsonforms-renderer-set > * {
              margin-bottom: 2px !important;
              margin-top: 0 !important;
            }
            .MuiGrid-container .MuiAutocomplete-root {
              width: 100% !important;
              min-width: 0 !important;
            }
            /* Make the model selector shrink to its content width on mobile */
            .MuiGrid-container .model-id-autocomplete {
              width: -moz-fit-content !important;
              width: fit-content !important;
              max-width: 100% !important;
              flex: 0 0 auto !important;
              margin-left: auto !important;
              margin-right: auto !important;
              display: flex !important;
              justify-content: center !important;
            }
            .MuiGrid-container .MuiTextField-root[data-field-type="number"] {
              width: 96px !important;
              min-width: 80px !important;
            }
            .MuiGrid-container .MuiFormControlLabel-root {
              margin-right: 8px !important;
            }
          }
        `}</style>

        <JsonForms
          schema={vm.schema}
          uischema={vm.uiSchema}
          data={vm.formData}
          renderers={renderers}
          cells={cells}
          ajv={ajv}
          onChange={({ data }) => vm.setFormData(data)}
          config={{
            restrict: true,
            trim: false,
            showUnfocusedDescription: true,
            hideRequiredAsterisk: true,
          }}
        />
      </div>
    );
  }
);
