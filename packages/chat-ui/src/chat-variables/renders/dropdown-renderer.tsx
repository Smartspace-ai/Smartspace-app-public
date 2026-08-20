import type {
  ControlElement,
  ControlProps,
  JsonSchema7,
} from '@jsonforms/core';
import { rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import React, { useCallback } from 'react';

import { fieldColor } from './fieldColors';

type AccessUiSchema = { access?: 'Read' | 'Write' };
type Option = { const: unknown; title?: string };

function hasConst(x: unknown): x is { const: unknown; title?: unknown } {
  return !!x && typeof x === 'object' && 'const' in x;
}

function toOptions(schema: JsonSchema7 | undefined): Option[] {
  if (!schema) return [];

  const fromOneOfAnyOf = (arr?: unknown) => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(hasConst).map((s) => ({
      const: s.const,
      title: typeof s.title === 'string' ? s.title : undefined,
    }));
  };

  const oneOf = fromOneOfAnyOf(
    (schema as unknown as { oneOf?: unknown }).oneOf
  );
  if (oneOf.length) return oneOf;

  const anyOf = fromOneOfAnyOf(
    (schema as unknown as { anyOf?: unknown }).anyOf
  );
  if (anyOf.length) return anyOf;

  const enumVals = (schema as unknown as { enum?: unknown }).enum;
  if (Array.isArray(enumVals)) {
    return enumVals.map((v) => ({
      const: v,
      title: typeof v === 'string' ? v : String(v),
    }));
  }

  return [];
}

/** Settings-list scale, matching the textarea renderer's `dense` config. */
type DropdownFormConfig = { dense?: boolean };

const DropdownRenderer: React.FC<ControlProps> = ({
  data,
  handleChange,
  path,
  enabled,
  schema,
  label,
  description,
  errors,
  config,
  uischema,
}) => {
  // Get options from oneOf or anyOf
  const options = toOptions(schema as JsonSchema7 | undefined);

  const handleSelectionChange = useCallback(
    (event: SelectChangeEvent<unknown>) => {
      handleChange(path, event.target.value);
    },
    [handleChange, path]
  );

  const displayValue = data ?? '';

  // In the variables panel these stack with the other fields, so they take the
  // same compact scale rather than the 40px control the composer bar used.
  const dense = ((config ?? {}) as DropdownFormConfig).dense === true;
  const controlHeight = dense ? '34px' : '40px';
  const labelSize = dense ? '0.75rem' : '0.875rem';
  const valueSize = dense ? '0.8125rem' : '0.875rem';

  // Get readOnly from uischema (set when access === 'Read')
  const readOnly =
    (uischema as unknown as AccessUiSchema | undefined)?.access === 'Read';
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
        minWidth: '220px',
      }}
    >
      <InputLabel
        id={`${path}-label`}
        sx={{
          color: fieldColor.mutedText,
          fontSize: labelSize,
          fontWeight: 500,
          '&.Mui-focused': {
            color: fieldColor.accent,
          },
          '&.Mui-error': {
            color: fieldColor.danger,
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
            backgroundColor: fieldColor.surface,
            borderRadius: '8px',
            transition: 'all 0.2s ease-in-out',
            height: controlHeight,
            '& fieldset': {
              borderColor: fieldColor.border,
              borderWidth: '1px',
            },
            '&:hover': {
              backgroundColor: fieldColor.surface,
              '& fieldset': {
                borderColor: fieldColor.borderHover,
              },
            },
            '&.Mui-focused': {
              backgroundColor: fieldColor.surface,
              '& fieldset': {
                borderColor: fieldColor.accent,
                borderWidth: '2px',
              },
            },
            '&.Mui-error': {
              '& fieldset': {
                borderColor: fieldColor.danger,
              },
            },
          },
          '& .MuiSelect-select': {
            backgroundColor: fieldColor.surface,
            borderRadius: '8px',
            transition: 'all 0.2s ease-in-out',
            height: controlHeight,
            fontSize: valueSize,
            display: 'flex',
            alignItems: 'center',
            paddingRight: '32px !important',
            '&:hover': {
              backgroundColor: fieldColor.surface,
            },
            '&.Mui-focused': {
              backgroundColor: fieldColor.surface,
            },
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: fieldColor.border,
            borderWidth: '1px',
            borderRadius: '8px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: fieldColor.borderHover,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: fieldColor.accent,
            borderWidth: '2px',
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: fieldColor.danger,
          },
          '& .MuiSelect-icon': {
            color: fieldColor.mutedText,
            '&:hover': {
              color: fieldColor.mutedText,
            },
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: '8px',
              boxShadow:
                '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${fieldColor.border}`,
              backgroundColor: fieldColor.menuSurface,
              color: fieldColor.text,
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
        {options.map((option, index) => {
          const raw = option.const;
          const key =
            typeof raw === 'string' || typeof raw === 'number'
              ? String(raw)
              : String(index);
          const value =
            typeof raw === 'string' || typeof raw === 'number'
              ? raw
              : String(raw ?? index);

          return (
            <MenuItem
              key={key}
              value={value}
              sx={{
                padding: '12px 16px',
                fontSize: '0.875rem',
                borderBottom: `1px solid ${fieldColor.hairline}`,
                '&:last-child': {
                  borderBottom: 'none',
                },
                '&:hover': {
                  backgroundColor: fieldColor.optionHover,
                },
                '&.Mui-selected': {
                  backgroundColor: fieldColor.optionSelected,
                  '&:hover': {
                    backgroundColor: fieldColor.optionSelectedHover,
                  },
                },
              }}
            >
              {option.title ?? String(raw)}
            </MenuItem>
          );
        })}
      </Select>
      {(description || errors) && (
        <div
          style={{
            fontSize: '0.75rem',
            marginTop: '4px',
            color: errors ? fieldColor.danger : fieldColor.mutedText,
          }}
        >
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
    if (uischema.type !== 'Control') {
      return false;
    }

    // Extract the property path from the scope
    const propertyPath = (uischema as ControlElement).scope.replace(
      '#/properties/',
      ''
    );
    const fieldSchema = (schema as JsonSchema7 | undefined)?.properties?.[
      propertyPath
    ] as JsonSchema7 | undefined;

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
    const isModelSelector =
      (typeof fieldSchema === 'object' &&
        fieldSchema &&
        (fieldSchema as unknown as Record<string, unknown>)[
          'x-model-selector'
        ] === true) ||
      fieldSchema.title === 'ModelId' ||
      fieldSchema.format === 'uuid';

    return hasDropdownOptions && !isModelSelector;
  }
);

// Export the wrapped component
export const DropdownRendererControl =
  withJsonFormsControlProps(DropdownRenderer);
