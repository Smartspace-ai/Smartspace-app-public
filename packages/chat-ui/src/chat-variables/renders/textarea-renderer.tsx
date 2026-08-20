import type {
  ControlElement,
  ControlProps,
  JsonSchema7,
  RankedTester,
} from '@jsonforms/core';
import { rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React, { useCallback, useEffect, useRef } from 'react';

import { fieldColor } from './fieldColors';

type AccessUiSchema = { access?: 'Read' | 'Write' };
type TextareaUiOptions = {
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
};
/** Host-supplied sizing, passed as JsonForms `config`. */
type TextareaFormConfig = {
  minRows?: number;
  maxRows?: number;
  /** Settings-list scale, for a form that isn't the focus of the screen. */
  dense?: boolean;
};

/**
 * Two scales. `comfortable` is a field someone is writing into — an answer to a
 * question asked in the conversation. `dense` is a row in a settings list, where
 * a stack of these has to stay scannable: at the comfortable scale the variables
 * panel came out as a column of chunky three-line boxes with headings.
 *
 * `lineHeight` and `padding` are in px so the row arithmetic below is exact.
 */
const SCALE = {
  comfortable: {
    fontSize: '16px',
    lineHeight: 24,
    padding: 12,
    labelSize: '0.875rem',
    labelGap: '0.375rem',
    radius: '6px',
  },
  dense: {
    fontSize: '0.8125rem',
    lineHeight: 18,
    padding: 8,
    labelSize: '0.75rem',
    labelGap: '0.25rem',
    radius: '8px',
  },
} as const;

const DEFAULT_MIN_ROWS = 3;
const DEFAULT_MAX_ROWS = 9;

type Scale = (typeof SCALE)[keyof typeof SCALE];

/** Plus the 1px border on each edge. */
const rowsToPx = (rows: number, scale: Scale) =>
  rows * scale.lineHeight + scale.padding * 2 + 2;

const TextareaRenderer: React.FC<ControlProps> = ({
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
  config,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get textarea-specific options from schema
  const textareaOptions =
    ((schema as unknown as Record<string, unknown>)['ui:textarea'] as
      | TextareaUiOptions
      | undefined) ?? {};
  // The field's own schema wins, then whatever the host form asked for — the
  // chat's user-question form wants a far taller box than the variables bar.
  const formConfig = (config ?? {}) as TextareaFormConfig;
  const scale = formConfig.dense ? SCALE.dense : SCALE.comfortable;
  const minRows =
    textareaOptions.minRows ?? formConfig.minRows ?? DEFAULT_MIN_ROWS;
  const maxRows = Math.max(
    minRows,
    textareaOptions.maxRows ?? formConfig.maxRows ?? DEFAULT_MAX_ROWS
  );
  const minHeight = rowsToPx(minRows, scale);
  const maxHeight = rowsToPx(maxRows, scale);

  // Grow with the content, between those two bounds, then scroll.
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(
      Math.max(el.scrollHeight, minHeight),
      maxHeight
    )}px`;
  }, [minHeight, maxHeight]);

  useEffect(() => {
    autoResize();
  }, [data, autoResize]);

  // A narrower box rewraps the text into more lines, so the height has to be
  // recomputed when the layout around it changes.
  useEffect(() => {
    window.addEventListener('resize', autoResize);
    return () => window.removeEventListener('resize', autoResize);
  }, [autoResize]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleChange(path, event.target.value);
      // Measure the element itself: `data` only comes back on the next render,
      // and a controlled textarea already holds the new text.
      autoResize();
    },
    [handleChange, path, autoResize]
  );

  if (!visible) {
    return null;
  }

  // Get readOnly from uischema (set when access === 'Read')
  const readOnly =
    (uischema as unknown as AccessUiSchema | undefined)?.access === 'Read';
  const isDisabled = !enabled || readOnly;
  const hasError = errors && errors.length > 0;

  const placeholder =
    textareaOptions.placeholder ||
    (schema as JsonSchema7 | undefined)?.description ||
    `Enter ${label?.toLowerCase() || 'text'}...`;

  return (
    <div className="ss-jsonforms-field ss-jsonforms-textarea">
      {label && (
        <label
          style={{
            display: 'block',
            color: hasError ? fieldColor.danger : fieldColor.mutedText,
            fontSize: scale.labelSize,
            fontWeight: 500,
            marginBottom: scale.labelGap,
          }}
        >
          {label}
          {required && (
            <span style={{ color: fieldColor.danger, marginLeft: '0.25rem' }}>
              *
            </span>
          )}
        </label>
      )}

      {description && (
        <div
          style={{
            color: fieldColor.mutedText,
            fontSize: '0.75rem',
            marginBottom: '0.5rem',
          }}
        >
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
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          resize: 'vertical',
          padding: `${scale.padding}px`,
          border: hasError
            ? `1px solid ${fieldColor.danger}`
            : `1px solid ${fieldColor.border}`,
          borderRadius: scale.radius,
          fontSize: scale.fontSize,
          lineHeight: `${scale.lineHeight}px`,
          fontFamily: 'inherit',
          backgroundColor: isDisabled
            ? fieldColor.surfaceDisabled
            : fieldColor.surface,
          color: isDisabled ? fieldColor.mutedText : fieldColor.text,
          outline: 'none',
          transition:
            'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          boxShadow: hasError ? `0 0 0 1px ${fieldColor.danger}` : 'none',
          WebkitTextSizeAdjust: '100%',
        }}
        onFocus={(e) => {
          if (!hasError) {
            e.target.style.borderColor = fieldColor.accent;
            e.target.style.boxShadow = `0 0 0 1px ${fieldColor.accent}`;
          }
        }}
        onBlur={(e) => {
          if (!hasError) {
            e.target.style.borderColor = fieldColor.border;
            e.target.style.boxShadow = 'none';
          }
        }}
      />

      {hasError && (
        <div
          style={{
            color: fieldColor.danger,
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

// Tester function that makes textarea the default for string fields, except for very short fields
export const textareaRendererTester: RankedTester = rankWith(
  30, // Higher priority than material renderers (20) but lower than specialized ones (100)
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

    if (!fieldSchema || fieldSchema.type !== 'string') {
      return false;
    }

    // Explicit single-line indicators - use single line input
    const widget = (fieldSchema as unknown as Record<string, unknown>)[
      'ui:widget'
    ];
    const hasExplicitSingleLine =
      widget === 'text' ||
      widget === 'input' ||
      fieldSchema.format === 'email' ||
      fieldSchema.format === 'uri' ||
      fieldSchema.format === 'password' ||
      fieldSchema.format === 'uuid' ||
      fieldSchema.enum; // dropdown/select fields

    if (hasExplicitSingleLine) {
      return false;
    }

    // Very short maxLength suggests single line (about 1 line = ~60 characters)
    const hasVeryShortMaxLength =
      fieldSchema.maxLength && fieldSchema.maxLength < 60;

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
export const TextareaRendererControl =
  withJsonFormsControlProps(TextareaRenderer);
