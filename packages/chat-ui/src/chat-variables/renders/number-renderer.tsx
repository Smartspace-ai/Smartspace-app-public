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

/**
 * A numeric workspace variable, shaped to sit in the composer's action bar
 * beside the toggle pills: one bordered capsule holding the label and a bare
 * input. Everything is a semantic token, so it follows the colour scheme
 * instead of staying a white box in dark mode.
 *
 * Unlike the toggles, the label stays visible at every width — a lone number
 * box with no name tells the reader nothing.
 */
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

  // The description and any validation message ride along as the native
  // tooltip; an extra block of text would break the single-row action bar.
  const tooltip = [label, description, hasError ? errors : null]
    .filter(Boolean)
    .join(' — ');

  return (
    <div
      className={`ss-jsonforms-field ss-jsonforms-number flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors focus-within:border-primary/40 ${
        hasError ? 'border-destructive' : 'border-border/70'
      } ${isDisabled ? 'opacity-60' : ''}`}
      title={tooltip || undefined}
    >
      {label && (
        <label
          htmlFor={`number-${path}`}
          // Capped like the toggle pill's label: a long variable name ends in
          // an ellipsis rather than stretching the capsule across the bar.
          className={`max-w-[9rem] truncate whitespace-nowrap ${
            hasError ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
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
        className="w-14 border-0 bg-transparent p-0 text-xs font-medium tabular-nums text-foreground outline-none disabled:cursor-not-allowed"
      />
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
