import { useThreadVariables, useUpdateVariable } from '@/domains/threads/use-workspace-thread';
import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { Loader2 } from 'lucide-react';
import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Workspace } from '../../../shared/models/workspace';
import { BooleanRendererControl, booleanRendererTester } from './boolean-renderer';
import { DropdownRendererControl, dropdownRendererTester } from './dropdown-renderer';
import { JsonEditorRendererControl, jsonEditorTester } from './json-editor-renderer';
import { ModelIdRendererControl, modelIdRendererTester } from './model-id-renderer';
import { TextareaRendererControl, textareaRendererTester } from './textarea-renderer';

interface ChatVariablesFormProps {
  workspace: Workspace;
  threadId: string;
}

export interface ChatVariablesFormRef {
  hasChanges: () => boolean;
  getChangedVariables: () => Record<string, any>;
  getCurrentVariables: () => Record<string, any>;
  saveChangedVariables: () => Promise<void>;
}

export const ChatVariablesForm = forwardRef<ChatVariablesFormRef, ChatVariablesFormProps>(
  ({ workspace, threadId }, ref) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [originalData, setOriginalData] = useState<Record<string, any>>({});
    const updateVariableMutation = useUpdateVariable();
    const { data: threadVariables, isLoading: isLoadingVariables } = useThreadVariables({ threadId });

    // Check if workspace has any variables
    const hasVariables = useMemo(() => {
      return workspace.variables && Object.keys(workspace.variables).length > 0;
    }, [workspace.variables]);

    // Check if any variables have changes
    const hasChanges = useMemo(() => {
      return Object.keys(workspace.variables || {}).some(varName => {
        const originalValue = originalData[varName];
        const currentValue = formData[varName];
        
        // Handle flattened objects
        const varConfig = workspace.variables[varName];
        if (varConfig.schema.type === 'object' && 
            varConfig.schema.properties && 
            Object.keys(varConfig.schema.properties).length === 1) {
          const innerPropertyName = Object.keys(varConfig.schema.properties)[0];
          const originalInnerValue = originalValue && typeof originalValue === 'object' 
            ? originalValue[innerPropertyName] 
            : originalValue;
          return currentValue !== originalInnerValue;
        }
        
        return currentValue !== originalValue;
      });
    }, [formData, originalData, workspace.variables]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      hasChanges: () => {
        return Object.keys(workspace.variables || {}).some(varName => {
          const originalValue = originalData[varName];
          const currentValue = formData[varName];
          
          // Handle flattened objects
          const varConfig = workspace.variables[varName];
          if (varConfig.schema.type === 'object' && 
              varConfig.schema.properties && 
              Object.keys(varConfig.schema.properties).length === 1) {
            const innerPropertyName = Object.keys(varConfig.schema.properties)[0];
            const originalInnerValue = originalValue && typeof originalValue === 'object' 
              ? originalValue[innerPropertyName] 
              : originalValue;
            return currentValue !== originalInnerValue;
          }
          
          return currentValue !== originalValue;
        });
      },
      getChangedVariables: () => {
        const changed: Record<string, any> = {};
        Object.keys(workspace.variables || {}).forEach(varName => {
          const originalValue = originalData[varName];
          const currentValue = formData[varName];
          const varConfig = workspace.variables[varName];
          
          // Handle flattened objects
          if (varConfig.schema.type === 'object' && 
              varConfig.schema.properties && 
              Object.keys(varConfig.schema.properties).length === 1) {
            const innerPropertyName = Object.keys(varConfig.schema.properties)[0];
            const originalInnerValue = originalValue && typeof originalValue === 'object' 
              ? originalValue[innerPropertyName] 
              : originalValue;
            
            if (currentValue !== originalInnerValue) {
              // Reconstruct the object structure
              changed[varName] = { [innerPropertyName]: currentValue };
            }
          } else {
            if (currentValue !== originalValue) {
              changed[varName] = currentValue;
            }
          }
        });
        return changed;
      },
      getCurrentVariables: () => {
        const current: Record<string, any> = {};
        Object.keys(workspace.variables || {}).forEach(varName => {
          const currentValue = formData[varName];
          const varConfig = workspace.variables[varName];
          
          // Handle flattened objects
          if (varConfig.schema.type === 'object' && 
              varConfig.schema.properties && 
              Object.keys(varConfig.schema.properties).length === 1) {
            const innerPropertyName = Object.keys(varConfig.schema.properties)[0];
            // Reconstruct the object structure
            current[varName] = { [innerPropertyName]: currentValue };
          } else {
            current[varName] = currentValue;
          }
        });
        return current;
      },
      saveChangedVariables: async () => {
        const changedVars = Object.keys(workspace.variables || {}).filter(varName => {
          const originalValue = originalData[varName];
          const currentValue = formData[varName];
          const varConfig = workspace.variables[varName];
          
          // Handle flattened objects
          if (varConfig.schema.type === 'object' && 
              varConfig.schema.properties && 
              Object.keys(varConfig.schema.properties).length === 1) {
            const innerPropertyName = Object.keys(varConfig.schema.properties)[0];
            const originalInnerValue = originalValue && typeof originalValue === 'object' 
              ? originalValue[innerPropertyName] 
              : originalValue;
            return currentValue !== originalInnerValue;
          }
          
          return currentValue !== originalValue;
        });

        for (const varName of changedVars) {
          const variableConfig = workspace.variables[varName];
          if (variableConfig?.access === 'Write') {
            const currentValue = formData[varName];
            let valueToSave = currentValue;
            
            // Handle flattened objects - reconstruct the object structure
            if (variableConfig.schema.type === 'object' && 
                variableConfig.schema.properties && 
                Object.keys(variableConfig.schema.properties).length === 1) {
              const innerPropertyName = Object.keys(variableConfig.schema.properties)[0];
              valueToSave = { [innerPropertyName]: currentValue };
            }
            
            await updateVariableMutation.mutateAsync({
              flowRunId: threadId,
              variableName: varName,
              value: valueToSave
            });
          }
        }

        // Update original data to match current form data after successful save
        setOriginalData({ ...formData });
      }
    }), [formData, originalData, workspace.variables, threadId, updateVariableMutation]);

  // Create JSON Schema and UI Schema with smart layout
  const { schema, uiSchema, data } = useMemo(() => {
    if (!hasVariables) {
      return { 
        schema: { type: 'object', properties: {} }, 
        uiSchema: { type: 'VerticalLayout', elements: [] }, 
        data: {} 
      };
    }

    const properties: Record<string, any> = {};
    const uiElements: Record<string, any> = {};
    const initialData: Record<string, any> = {};

    // Categorize fields by layout type
    const compactFields: string[] = [];
    const fullWidthFields: string[] = [];

    Object.entries(workspace.variables).forEach(([varName, varConfig]) => {
      let schemaToUse = varConfig.schema;
      const  varNameToUse = varName;
      
      // If this is an object with only one property, flatten it
      if (schemaToUse.type === 'object' && 
          schemaToUse.properties && 
          Object.keys(schemaToUse.properties).length === 1) {
        const innerPropertyName = Object.keys(schemaToUse.properties)[0];
        const innerSchema = schemaToUse.properties[innerPropertyName];
        
        // Use the inner schema directly
        schemaToUse = { ...innerSchema };
        
        // If the inner schema has a title, use it, otherwise use the outer variable name
        if (!schemaToUse.title) {
          schemaToUse.title = varName;
        }
      }
      
      properties[varNameToUse] = schemaToUse;
      
      // Set initial data from thread variables, or fallback to schema default
      let initialValue;
      if (threadVariables && threadVariables[varName] !== undefined) {
        initialValue = threadVariables[varName];
      } else if (varConfig.schema.default !== undefined) {
        initialValue = varConfig.schema.default;
      }
      
      // If we flattened an object, extract the inner property value
      if (varConfig.schema.type === 'object' && 
          varConfig.schema.properties && 
          Object.keys(varConfig.schema.properties).length === 1) {
        const innerPropertyName = Object.keys(varConfig.schema.properties)[0];
        if (initialValue && typeof initialValue === 'object' && initialValue[innerPropertyName] !== undefined) {
          initialData[varNameToUse] = initialValue[innerPropertyName];
        } else if (varConfig.schema.properties[innerPropertyName].default !== undefined) {
          initialData[varNameToUse] = varConfig.schema.properties[innerPropertyName].default;
        }
      } else {
        if (initialValue !== undefined) {
          initialData[varNameToUse] = initialValue;
        }
      }

      // Categorize fields for layout
      const isModelSelector = (schemaToUse as any)['x-model-selector'] === true || schemaToUse.title === 'ModelId';
      const isCompact = (
        schemaToUse.type === 'boolean' ||
        schemaToUse.enum ||
        schemaToUse.oneOf ||
        schemaToUse.anyOf ||
        schemaToUse.format === 'uuid' ||
        (schemaToUse.type === 'number' && !schemaToUse.multipleOf) ||
        (schemaToUse.type === 'string' && schemaToUse.maxLength && schemaToUse.maxLength <= 50)
      );

      // Configure UI elements with sizing and read-only state
      const elementConfig: any = {};
      
      // Add read-only for variables with 'Read' access
      if (varConfig.access === 'Read') {
        elementConfig['ui:readonly'] = true;
      }
      
      // Change ModelId label to Model
      if (schemaToUse.title === 'ModelId') {
        elementConfig.label = 'Model';
      }

      if (Object.keys(elementConfig).length > 0) {
        uiElements[varNameToUse] = elementConfig;
      }

      // Place model selector inline with compact fields on desktop
      if (isModelSelector) {
        compactFields.push(varNameToUse);
      } else if (isCompact) {
        compactFields.push(varNameToUse);
      } else {
        fullWidthFields.push(varNameToUse);
      }
    });

    // Create layout elements
    const layoutElements: any[] = [];

    // Add full-width fields first
    fullWidthFields.forEach(varName => {
      layoutElements.push({
        type: 'Control',
        scope: `#/properties/${varName}`,
        ...uiElements[varName]
      });
    });

    // Add all compact fields in a single horizontal layout that will flex wrap
    if (compactFields.length > 0) {
      layoutElements.push({
        type: 'HorizontalLayout',
        elements: compactFields.map(varName => ({
          type: 'Control',
          scope: `#/properties/${varName}`,
          ...uiElements[varName]
        })),
        options: {
          gap: '12px',
          alignItems: 'flex-start'
        }
      });
    }

    const jsonSchema = {
      type: 'object',
      properties
    };

    const jsonUiSchema = {
      type: 'VerticalLayout',
      elements: layoutElements
    };

    return {
      schema: jsonSchema,
      uiSchema: jsonUiSchema,
      data: initialData
    };
  }, [workspace.variables, hasVariables, threadVariables]);

  // Initialize form data when component mounts or thread variables load
  React.useEffect(() => {
    // Wait for thread variables to load before initializing form data
    if (hasVariables && !isLoadingVariables && Object.keys(formData).length === 0) {
      setFormData(data);
      setOriginalData(data); // Initialize original data
    }
  }, [data, hasVariables, formData, isLoadingVariables]);

  const handleDataChange = ({ data: newData }: { data: any }) => {
    // Find which field changed by comparing old and new data
    const changedFields = Object.keys(newData).filter(
      key => formData[key] !== newData[key]
    );

    // Update the form data only - don't update original data here
    setFormData(newData);
  };

  if (!hasVariables) {
    return null;
  }

  // Show loading state while fetching thread variables
  if (isLoadingVariables) {
    return (
      <div className="flex justify-center items-center w-full h-8">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div>
        <div>
          <style>
            {`
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
                .jsonforms-vertical-layout > * ,
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
            `}
          </style>
          <JsonForms
            schema={schema}
            uischema={uiSchema}
            data={formData}
            renderers={[
              { tester: modelIdRendererTester, renderer: ModelIdRendererControl },
              { tester: booleanRendererTester, renderer: BooleanRendererControl },
              { tester: dropdownRendererTester, renderer: DropdownRendererControl },
              { tester: textareaRendererTester, renderer: TextareaRendererControl },
              ...materialRenderers,
              { tester: jsonEditorTester, renderer: JsonEditorRendererControl }
            ]}
            cells={materialCells}
            onChange={handleDataChange}
            config={{
              restrict: true,
              trim: false,
              showUnfocusedDescription: true,
              hideRequiredAsterisk: true
            }}
          />
        </div>
      </div>
    </div>
  );
}); 