import { ControlProps, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateIsMobile = () =>
      setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 640);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  const onToggle = useCallback(() => {
    handleChange(path, !data);
  }, [handleChange, path, data]);

  // Build styles that differ by mobile/non-mobile
  const dims = useMemo(
    () =>
      isMobile
        ? { w: undefined as any, h: '28px', pad: '2px 10px', knob: { size: 0 } }
        : { w: '44px', h: '24px', pad: undefined as any, knob: { size: 20 } },
    [isMobile]
  );

  if (!visible) return null;

  // Read-only if ui schema set access: 'Read'
  const readOnly = (uischema as any)?.access === 'Read';
  const isDisabled = !enabled || readOnly;

  const hasError = !!errors && errors.length > 0;
  const isChecked = Boolean(data);

  return (
    <div
      style={{
        paddingTop: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: isMobile ? '36px' : '40px',
        gap: isMobile ? 6 : 8
      }}
    >
      {/* Label (hidden on mobile; the button gets aria-label) */}
      {label && !isMobile && (
        <label
          htmlFor={`toggle-${path}`}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: hasError ? '#ef4444' : '#475569',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            userSelect: 'none',
            marginBottom: 0,
            lineHeight: '24px'
          }}
          onKeyDown={!isDisabled ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle();
            }
          } : undefined}
          tabIndex={isDisabled ? -1 : 0}
        >
          {label}
          {(schema as any)?.required && (
            <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
          )}
        </label>
      )}

      {/* Toggle Switch */}
      <button
        id={`toggle-${path}`}
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={label}
        onClick={onToggle}
        disabled={isDisabled}
        // Blur the element after *pointer* interactions so the ring doesn't linger.
        onPointerUp={(e) => {
          // Keep keyboard focus visible for accessibility; only blur on pointer
          if ((e as any).pointerType === 'mouse' || (e as any).pointerType === 'touch' || (e as any).pointerType === 'pen') {
            (e.currentTarget as HTMLButtonElement).blur();
          }
        }}
        className="boolean-switch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: dims.w,
          height: dims.h,
          padding: dims.pad,
          borderRadius: isMobile ? '9999px' : '12px',
          border: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          backgroundColor: isChecked ? 'hsl(var(--primary))' : '#e5e7eb',
          transition: 'background-color 0.2s ease-in-out',
          outline: 'none',
          opacity: isDisabled ? 0.6 : 1,
          alignSelf: 'center',
          color: isMobile ? (isChecked ? '#ffffff' : '#374151') : undefined,
          fontSize: isMobile ? '0.75rem' : undefined,
          fontWeight: isMobile ? 600 : undefined
        }}
      >
        {/* Knob for desktop */}
        {!isMobile && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: isChecked ? '22px' : '2px',
              top: '2px',
              width: `${dims.knob.size}px`,
              height: `${dims.knob.size}px`,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              transition: 'left 0.2s ease-in-out',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          />
        )}
        {/* Inline text for mobile (keeps compact width) */}
        {isMobile && (
          <span
            style={{
              padding: '0 2px',
              lineHeight: 1,
              whiteSpace: 'nowrap'
            }}
          >
            {label}
          </span>
        )}
      </button>

      {/* Description and Errors */}
      {description && (
        <div
          style={{
            color: '#6b7280',
            fontSize: '0.75rem',
            marginTop: isMobile ? '2px' : '4px'
          }}
        >
          {description}
        </div>
      )}

      {hasError && (
        <div
          style={{
            color: '#ef4444',
            fontSize: '0.75rem',
            marginTop: isMobile ? '2px' : '4px'
          }}
        >
          {errors}
        </div>
      )}
    </div>
  );
};

// Match boolean fields
export const booleanRendererTester: RankedTester = rankWith(
  40,
  (uischema, schema) => {
    if (uischema.type !== 'Control' || !(uischema as any).scope) return false;
    const propertyPath = (uischema as any).scope.replace('#/properties/', '');
    const fieldSchema = schema?.properties?.[propertyPath];
    return fieldSchema?.type === 'boolean';
  }
);

export const BooleanRendererControl = withJsonFormsControlProps(BooleanRenderer);
