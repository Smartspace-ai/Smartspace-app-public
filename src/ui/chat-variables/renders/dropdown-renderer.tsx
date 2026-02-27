import { rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React, { useCallback } from 'react';

interface DropdownRendererProps {
  data: any;
  handleChange: (path: string, value: any) => void;
  path: string;
  enabled: boolean;
  schema: any;
  label: string;
  description?: string;
  errors?: string;
  required?: boolean;
  uischema?: any;
  visible?: boolean;
}

const DropdownRenderer: React.FC<DropdownRendererProps> = ({
  data,
  handleChange,
  path,
  enabled,
  schema,
  label,
  description,
  errors,
  required,
  uischema
}) => {
  // Get options from oneOf or anyOf
  const options = schema.oneOf || schema.anyOf || schema.enum?.map((value: any) => ({ const: value, title: value })) || [];

  const handleSelectionChange = useCallback((event: any) => {
    const newValue = event.target.value;
    handleChange(path, newValue);
  }, [handleChange, path]);

  // Find the current option to display its title
  const currentOption = options.find((option: any) => option.const === data);
  const displayValue = data || '';

  // Get readOnly from uischema (set when access === 'Read')
  const readOnly = (uischema as any)?.access === 'Read';
  const isDisabled = !enabled || readOnly;

  return (
    <FormControl 
      variant="outlined" 
      size="small" 
      fullWidth
      error={!!errors}
      disabled={isDisabled}
      className="compact-field"
      sx={{
        minWidth: '220px'
      }}
    >
      <InputLabel 
        id={`${path}-label`}
        sx={{
          color: '#6b7280',
          fontSize: '0.875rem',
          fontWeight: 500,
          '&.Mui-focused': {
            color: '#6366f1',
          },
          '&.Mui-error': {
            color: '#ef4444',
          },
        }}
      >
        {label}
      </InputLabel>
      <Select
        labelId={`${path}-label`}
        value={displayValue}
        onChange={handleSelectionChange}
        label={label}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            transition: 'all 0.2s ease-in-out',
            height: '40px', // Same height as model dropdown
            '& fieldset': {
              borderColor: '#e5e7eb',
              borderWidth: '1px',
            },
            '&:hover': {
              backgroundColor: '#ffffff',
              '& fieldset': {
                borderColor: '#9ca3af',
              },
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
              '& fieldset': {
                borderColor: '#6366f1',
                borderWidth: '2px',
              },
            },
            '&.Mui-error': {
              '& fieldset': {
                borderColor: '#ef4444',
              },
            },
          },
          '& .MuiSelect-select': {
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            transition: 'all 0.2s ease-in-out',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            paddingRight: '32px !important',
            '&:hover': {
              backgroundColor: '#ffffff',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
            },
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e5e7eb',
            borderWidth: '1px',
            borderRadius: '8px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#9ca3af',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6366f1',
            borderWidth: '2px',
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ef4444',
          },
          '& .MuiSelect-icon': {
            color: '#9ca3af',
            '&:hover': {
              color: '#6b7280',
            },
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e5e7eb',
              marginTop: '4px',
              maxHeight: '280px',
            },
          },
          MenuListProps: {
            sx: {
              padding: 0,
            },
          },
        }}
      >
        {options.map((option: any, index: number) => (
          <MenuItem 
            key={option.const || index} 
            value={option.const}
            sx={{
              padding: '12px 16px',
              fontSize: '0.875rem',
              borderBottom: '1px solid #f3f4f6',
              '&:last-child': {
                borderBottom: 'none',
              },
              '&:hover': {
                backgroundColor: '#f8fafc',
              },
              '&.Mui-selected': {
                backgroundColor: '#eff6ff',
                '&:hover': {
                  backgroundColor: '#dbeafe',
                },
              },
            }}
          >
            {option.title || option.const}
          </MenuItem>
        ))}
      </Select>
      {(description || errors) && (
        <div style={{
          fontSize: '0.75rem',
          marginTop: '4px',
          color: errors ? '#ef4444' : '#6b7280'
        }}>
          {errors || description}
        </div>
      )}
    </FormControl>
  );
};

// Create the tester function for JSON Forms
export const dropdownRendererTester = rankWith(
  90, // High priority to override material renderers
  (uischema, schema) => {
    // Check if this is a Control element
    if (uischema.type !== 'Control' || !(uischema as any).scope) {
      return false;
    }

    // Extract the property path from the scope
    const propertyPath = (uischema as any).scope.replace('#/properties/', '');
    const fieldSchema = schema?.properties?.[propertyPath];
    
    if (!fieldSchema) {
      return false;
    }

    // Check if this field has oneOf, anyOf, or enum (dropdown indicators)
    const hasDropdownOptions = !!(
      fieldSchema.oneOf || 
      fieldSchema.anyOf || 
      (fieldSchema.enum && Array.isArray(fieldSchema.enum))
    );

    // Don't handle model selector fields (they have their own renderer)
    const isModelSelector = !!(
      (fieldSchema as any)['x-model-selector'] === true ||
      fieldSchema.title === 'ModelId' ||
      fieldSchema.format === 'uuid'
    );

    return hasDropdownOptions && !isModelSelector;
  }
);

// Export the wrapped component
export const DropdownRendererControl = withJsonFormsControlProps(DropdownRenderer as any); 