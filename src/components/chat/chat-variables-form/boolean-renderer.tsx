import { ControlProps, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React, { useCallback } from 'react';

interface BooleanRendererProps extends ControlProps {
  data: any;
  handleChange: (path: string, value: any) => void;
  path: string;
}

const BooleanRenderer: React.FC<BooleanRendererProps> = ({
  data,
  handleChange,
  path,
  label,
  description,
  errors,
  schema,
  uischema,
  visible,
  enabled
}) => {
  const handleToggle = useCallback(() => {
    handleChange(path, !data);
  }, [handleChange, path, data]);

  if (!visible) {
    return null;
  }

  const isDisabled = !enabled;
  const hasError = errors && errors.length > 0;
  const isChecked = Boolean(data);

  return (
    <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'row', minHeight: '56px' }}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={`toggle-${path}`}
          style={{ 
            fontSize: '0.875rem',
            marginRight: '8px',
            fontWeight: 500, 
            color: hasError ? '#ef4444' : '#475569',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            userSelect: 'none',
            marginBottom: '8px'
          }}
          onClick={!isDisabled ? handleToggle : undefined}
        >
          {label}
          {schema.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}

      {/* Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        onClick={handleToggle}
        disabled={isDisabled}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          border: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          backgroundColor: isChecked ? '#6366f1' : '#e5e7eb',
          transition: 'background-color 0.2s ease-in-out',
          outline: 'none',
          opacity: isDisabled ? 0.6 : 1,
          boxShadow: hasError ? '0 0 0 2px #ef4444' : 'none',
          alignSelf: 'flex-start'
        }}
        onFocus={(e) => {
          if (!hasError) {
            e.target.style.boxShadow = '0 0 0 2px #6366f1';
          }
        }}
        onBlur={(e) => {
          if (!hasError) {
            e.target.style.boxShadow = 'none';
          }
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: isChecked ? '22px' : '2px',
            top: '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            transition: 'left 0.2s ease-in-out',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        />
      </button>

      {/* Description and Errors */}
      {description && (
        <div style={{ 
          color: '#6b7280', 
          fontSize: '0.75rem',
          marginTop: '4px'
        }}>
          {description}
        </div>
      )}
      
      {hasError && (
        <div style={{ 
          color: '#ef4444', 
          fontSize: '0.75rem',
          marginTop: '4px'
        }}>
          {errors}
        </div>
      )}
    </div>
  );
};

// Tester function that matches boolean fields
export const booleanRendererTester: RankedTester = rankWith(
  40, // Higher priority than default boolean renderer but lower than specialized ones
  (uischema, schema) => {
    // Check if this is a Control element
    if (uischema.type !== 'Control' || !(uischema as any).scope) {
      return false;
    }

    // Extract the property path from the scope
    const propertyPath = (uischema as any).scope.replace('#/properties/', '');
    const fieldSchema = schema?.properties?.[propertyPath];
    
    // Check if this is a boolean field
    return fieldSchema?.type === 'boolean';
  }
);

// Enhanced component with JsonForms integration
export const BooleanRendererControl = withJsonFormsControlProps(BooleanRenderer); 