import type {
  ControlElement,
  ControlProps,
  JsonSchema7,
} from '@jsonforms/core';
import { rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Check, ChevronDown } from 'lucide-react';
import React, { useCallback, useRef } from 'react';

import {
  fieldErrorClass,
  fieldHintClass,
  fieldLabelClass,
  fieldTriggerClass,
  popoverRowClass,
  POPOVER_MAX_HEIGHT_PX,
} from './fieldStyles';
import { useAnchoredPopover } from './useAnchoredPopover';

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

/**
 * A variable with a fixed set of values, shaped as the design's select: a
 * bordered control showing the current value on one line, opening a list of
 * options above the composer.
 *
 * It replaced an MUI `Select` whose floating notched label and hard-coded light
 * palette belonged to neither the design nor the theme, and which sliced a long
 * option name mid-word.
 */
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
  visible,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // In the variables panel these stack with the other fields, so they take the
  // compact scale rather than the design's full-size 40px control.
  const scale =
    ((config ?? {}) as DropdownFormConfig).dense === true
      ? 'dense'
      : 'comfortable';

  const { isOpen, close, toggle, renderPopover } = useAnchoredPopover({
    trigger: triggerRef,
    popover: listRef,
    // A select's list lines up with its own control.
    width: 'trigger',
    maxHeight: POPOVER_MAX_HEIGHT_PX,
    role: 'listbox',
    label: label || 'Options',
  });

  const options = toOptions(schema as JsonSchema7 | undefined);

  const select = useCallback(
    (value: unknown) => {
      handleChange(path, value);
      close();
    },
    [handleChange, path, close]
  );

  if (!visible) return null;

  // Get readOnly from uischema (set when access === 'Read')
  const readOnly =
    (uischema as unknown as AccessUiSchema | undefined)?.access === 'Read';
  const isDisabled = !enabled || readOnly;
  const hasError = !!errors;

  const selected = options.find((option) => option.const === data);
  const valueText = selected
    ? selected.title ?? String(selected.const)
    : data != null && data !== ''
    ? String(data)
    : '';
  const triggerId = `${path}-trigger`;

  return (
    <div className="ss-jsonforms-field ss-jsonforms-select compact-field">
      {label && (
        <label htmlFor={triggerId} className={fieldLabelClass(scale)}>
          {label}
        </label>
      )}

      <button
        id={triggerId}
        ref={triggerRef}
        type="button"
        disabled={isDisabled}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={valueText || undefined}
        className={`ss-jsonforms-select-trigger ${fieldTriggerClass(
          scale,
          hasError
        )}`}
      >
        {/* The whole point of the clamp: a long option name ends in an
            ellipsis instead of being cut mid-word. */}
        <span
          className={`min-w-0 flex-1 truncate ${
            valueText ? '' : 'text-muted-foreground'
          }`}
        >
          {valueText || `Select ${(label || 'value').toLowerCase()}…`}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {(errors || description) && (
        <div className={errors ? fieldErrorClass : fieldHintClass}>
          {errors || description}
        </div>
      )}

      {renderPopover(
        <div className="min-h-0 overflow-y-auto py-1">
          {options.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No options available
            </p>
          )}
          {options.map((option, index) => {
            const active = option.const === data;
            const text = option.title ?? String(option.const);
            return (
              <button
                key={
                  typeof option.const === 'string' ||
                  typeof option.const === 'number'
                    ? String(option.const)
                    : `option-${index}`
                }
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => select(option.const)}
                className={popoverRowClass}
              >
                <Check
                  className={`h-3.5 w-3.5 shrink-0 ${
                    active ? 'text-primary' : 'opacity-0'
                  }`}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {text}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
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
