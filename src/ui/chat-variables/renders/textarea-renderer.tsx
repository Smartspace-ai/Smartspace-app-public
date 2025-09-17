import { ControlProps, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React, { useCallback, useEffect, useRef } from 'react';

interface TextareaRendererProps extends ControlProps {
  data: any;
  handleChange: (path: string, value: any) => void;
  path: string;
}

const TextareaRenderer: React.FC<TextareaRendererProps> = ({
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        Math.max(textareaRef.current.scrollHeight, 80), // Minimum height of 80px
        240 // Maximum height of 240px
      )}px`;
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [data, autoResize]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    handleChange(path, newValue);
    
    // Trigger auto-resize after state update
    setTimeout(autoResize, 0);
  }, [handleChange, path, autoResize]);

  if (!visible) {
    return null;
  }

  // Get readOnly from uischema (set when access === 'Read')
  const readOnly = (uischema as any)?.access === 'Read';
  const isDisabled = !enabled || readOnly;
  const hasError = errors && errors.length > 0;

  // Get textarea-specific options from schema
  const textareaOptions = (schema as any)['ui:textarea'] || {};
  const placeholder = textareaOptions.placeholder || schema.description || `Enter ${label?.toLowerCase() || 'text'}...`;
  const minRows = textareaOptions.minRows || 3;
  const maxRows = textareaOptions.maxRows || 12;

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          color: hasError ? '#ef4444' : '#475569', 
          fontSize: '0.875rem', 
          fontWeight: 500, 
          marginBottom: '0.375rem' 
        }}>
          {label}
          {schema.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}
      
      {description && (
        <div style={{ 
          color: '#6b7280', 
          fontSize: '0.75rem', 
          marginBottom: '0.5rem' 
        }}>
          {description}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={data || ''}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={isDisabled}
        rows={minRows}
        style={{
          width: '100%',
          minHeight: '80px',
          maxHeight: '240px',
          resize: 'vertical',
          padding: '0.75rem',
          border: hasError ? '2px solid #ef4444' : '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '16px',
          lineHeight: '1.5',
          fontFamily: 'inherit',
          backgroundColor: isDisabled ? '#f9fafb' : '#ffffff',
          color: isDisabled ? '#9ca3af' : '#111827',
          outline: 'none',
          transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          boxShadow: hasError ? '0 0 0 1px #ef4444' : 'none',
          WebkitTextSizeAdjust: '100%'
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
        <div style={{ 
          color: '#ef4444', 
          fontSize: '0.75rem', 
          marginTop: '0.25rem' 
        }}>
          {errors}
        </div>
      )}
    </div>
  );
};

// Tester function that makes textarea the default for string fields, except for very short fields
export const textareaRendererTester: RankedTester = rankWith(
  30, // Higher priority than material renderers (20) but lower than specialized ones (100)
  (uischema, schema) => {
    // Check if this is a Control element
    if (uischema.type !== 'Control' || !(uischema as any).scope) {
      return false;
    }

    // Extract the property path from the scope
    const propertyPath = (uischema as any).scope.replace('#/properties/', '');
    const fieldSchema = schema?.properties?.[propertyPath];
    
    if (!fieldSchema || fieldSchema.type !== 'string') {
      return false;
    }

    // Explicit single-line indicators - use single line input
    const hasExplicitSingleLine = (
      (fieldSchema as any)['ui:widget'] === 'text' ||
      (fieldSchema as any)['ui:widget'] === 'input' ||
      fieldSchema.format === 'email' ||
      fieldSchema.format === 'uri' ||
      fieldSchema.format === 'password' ||
      fieldSchema.format === 'uuid' ||
      fieldSchema.enum // dropdown/select fields
    );

    if (hasExplicitSingleLine) {
      return false;
    }

    // Very short maxLength suggests single line (about 1 line = ~60 characters)
    const hasVeryShortMaxLength = fieldSchema.maxLength && fieldSchema.maxLength < 60;
    
    if (hasVeryShortMaxLength) {
      return false;
    }

    if (fieldSchema.oneOf) {
      return false;
    }

    // Default to textarea for all other string fields
    return true;
  }
);

// Enhanced component with JsonForms integration
export const TextareaRendererControl = withJsonFormsControlProps(TextareaRenderer); 