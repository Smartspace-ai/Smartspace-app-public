import type {
  ControlElement,
  ControlProps,
  JsonSchema7,
  RankedTester,
} from '@jsonforms/core';
import { rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React, { useCallback } from 'react';

type AccessUiSchema = { access?: 'Read' | 'Write' };

const NumberRenderer: React.FC<ControlProps> = ({
  data,
  handleChange,
  path,
  label,
  description,
  errors,
  schema,
  uischema,
  visible,
  enabled,
  required,
}) => {
  const isInteger = (schema as JsonSchema7 | undefined)?.type === 'integer';

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      if (raw === '') {
        handleChange(path, undefined);
        return;
      }
      const parsed = isInteger ? parseInt(raw, 10) : parseFloat(raw);
      if (Number.isNaN(parsed)) {
        handleChange(path, undefined);
        return;
      }
      handleChange(path, parsed);
    },
    [handleChange, path, isInteger]
  );

  if (!visible) return null;

  const readOnly =
    (uischema as unknown as AccessUiSchema | undefined)?.access === 'Read';
  const isDisabled = !enabled || readOnly;
  const hasError = !!errors && errors.length > 0;

  const fieldSchema = schema as JsonSchema7 | undefined;
  const min = fieldSchema?.minimum;
  const max = fieldSchema?.maximum;
  const step = isInteger ? 1 : fieldSchema?.multipleOf ?? 'any';

  return (
    <div className="ss-jsonforms-field ss-jsonforms-number compact-field">
      {label && (
        <label
          htmlFor={`number-${path}`}
          style={{
            display: 'block',
            color: hasError ? '#ef4444' : '#475569',
            fontSize: '0.875rem',
            fontWeight: 500,
            marginBottom: '0.375rem',
          }}
        >
          {label}
          {required && (
            <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
          )}
        </label>
      )}

      {description && (
        <div
          style={{
            color: '#6b7280',
            fontSize: '0.75rem',
            marginBottom: '0.5rem',
          }}
        >
          {description}
        </div>
      )}

      <input
        id={`number-${path}`}
        type="number"
        value={data ?? ''}
        onChange={handleInputChange}
        disabled={isDisabled}
        min={min}
        max={max}
        step={step}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          border: hasError ? '2px solid #ef4444' : '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          fontFamily: 'inherit',
          backgroundColor: isDisabled ? '#f9fafb' : '#ffffff',
          color: isDisabled ? '#9ca3af' : '#111827',
          outline: 'none',
          boxSizing: 'border-box',
          transition:
            'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          boxShadow: hasError ? '0 0 0 1px #ef4444' : 'none',
        }}
        onFocus={(e) => {
          if (!hasError) {
            e.target.style.borderColor = '#6366f1';
            e.target.style.boxShadow = '0 0 0 1px #6366f1';
          }
        }}
        onBlur={(e) => {
          if (!hasError) {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.boxShadow = 'none';
          }
        }}
      />

      {hasError && (
        <div
          style={{
            color: '#ef4444',
            fontSize: '0.75rem',
            marginTop: '0.25rem',
          }}
        >
          {errors}
        </div>
      )}
    </div>
  );
};

export const numberRendererTester: RankedTester = rankWith(
  40,
  (uischema, schema) => {
    if (uischema.type !== 'Control') return false;
    const propertyPath = (uischema as ControlElement).scope.replace(
      '#/properties/',
      ''
    );
    const fieldSchema = (schema as JsonSchema7 | undefined)?.properties?.[
      propertyPath
    ] as JsonSchema7 | undefined;
    if (!fieldSchema) return false;
    return fieldSchema.type === 'integer' || fieldSchema.type === 'number';
  }
);

export const NumberRendererControl = withJsonFormsControlProps(NumberRenderer);
