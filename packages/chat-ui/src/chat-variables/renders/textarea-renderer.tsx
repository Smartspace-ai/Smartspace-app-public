import type {
  ControlElement,
  ControlProps,
  JsonSchema7,
  RankedTester,
} from '@jsonforms/core';
import { rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  fieldControlClass,
  fieldErrorClass,
  fieldHintClass,
  fieldLabelClass,
  scaleFor,
  type FieldSurface,
} from './fieldStyles';

type AccessUiSchema = { access?: 'Read' | 'Write' };
type TextareaUiOptions = {
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
};
/** Host-supplied sizing and placement, passed as JsonForms `config`. */
type TextareaFormConfig = {
  minRows?: number;
  maxRows?: number;
  surface?: FieldSurface;
};

/**
 * Two scales, both the design's. `comfortable` is its own field metric — 14px
 * type in a `px-3 py-2` box — for something being written into, like an answer
 * to a question asked in the conversation. `dense` is one step down, for the
 * variables list, where a stack of full-size fields read as a column of blocks.
 *
 * `lineHeight` and `padding` are the px behind those classes, so the row
 * arithmetic below matches what is rendered.
 */
const SCALE = {
  comfortable: { lineHeight: 20, padding: 8 },
  dense: { lineHeight: 16, padding: 6 },
} as const;

type Scale = (typeof SCALE)[keyof typeof SCALE];

/** Plus the 1px border on each edge. */
const rowsToPx = (rows: number, scale: Scale) =>
  rows * scale.lineHeight + scale.padding * 2 + 2;

/**
 * However many rows a host asks for, the box is still one message in a
 * conversation: past this share of the window it fills the chat area and pushes
 * the send control below the fold. Half leaves the 20-row answer box its full
 * height on a roomy screen and reins it in on a laptop.
 */
const MAX_VIEWPORT_SHARE = 0.5;

const DEFAULT_MIN_ROWS = 3;
const DEFAULT_MAX_ROWS = 9;

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
  const scaleName = scaleFor(formConfig.surface ?? 'form');
  const scale = SCALE[scaleName];
  const minRows =
    textareaOptions.minRows ?? formConfig.minRows ?? DEFAULT_MIN_ROWS;
  const maxRows = Math.max(
    minRows,
    textareaOptions.maxRows ?? formConfig.maxRows ?? DEFAULT_MAX_ROWS
  );
  const minHeight = rowsToPx(minRows, scale);
  const maxHeight = rowsToPx(maxRows, scale);

  const [viewportCap, setViewportCap] = useState(() =>
    typeof window === 'undefined'
      ? Number.POSITIVE_INFINITY
      : Math.round(window.innerHeight * MAX_VIEWPORT_SHARE)
  );
  // The row count is what the host asked for; the window is what there is room
  // for. Never below `minHeight`, or a short window would invert the two.
  const ceiling = Math.max(minHeight, Math.min(maxHeight, viewportCap));

  // Grow with the content, between those two bounds, then scroll.
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(
      Math.max(el.scrollHeight, minHeight),
      ceiling
    )}px`;
  }, [minHeight, ceiling]);

  useEffect(() => {
    autoResize();
  }, [data, autoResize]);

  // A narrower box rewraps the text into more lines, and a shorter window lowers
  // the ceiling — both change the height this box should take.
  useEffect(() => {
    const onResize = () => {
      setViewportCap(Math.round(window.innerHeight * MAX_VIEWPORT_SHARE));
      autoResize();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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
        <label htmlFor={path} className={fieldLabelClass(scaleName)}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}

      {description && <div className={fieldHintClass}>{description}</div>}

      <textarea
        id={path}
        ref={textareaRef}
        value={data || ''}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={isDisabled}
        rows={minRows}
        className={`resize-y ${fieldControlClass(scaleName, !!hasError)}`}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${ceiling}px`,
          // iOS zooms a focused control under 16px; the design's fields are
          // 14px, so opt out of the adjustment rather than the design.
          WebkitTextSizeAdjust: '100%',
        }}
      />

      {hasError && <div className={fieldErrorClass}>{errors}</div>}
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
