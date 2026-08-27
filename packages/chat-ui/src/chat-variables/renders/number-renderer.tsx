import type {
  ControlElement,
  ControlProps,
  JsonSchema7,
  RankedTester,
} from '@jsonforms/core';
import { rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React, { useCallback } from 'react';

import {
  fieldErrorClass,
  fieldNumberClass,
  fieldRowClass,
  fieldRowLabelClass,
  pillClass,
  pillLabelClass,
  scaleFor,
  type FieldSurface,
} from './fieldStyles';

type AccessUiSchema = { access?: 'Read' | 'Write' };

/**
 * A numeric workspace variable. In the composer's action bar it sits beside the
 * toggle pills as one capsule holding the label and a bare input; in a form it
 * is a settings row, the name on the left and the design's short number control
 * on the right.
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
  config,
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

  const surface =
    ((config ?? {}) as { surface?: FieldSurface }).surface ?? 'form';
  const scale = scaleFor(surface);

  const input = (
    <input
      id={`number-${path}`}
      type="number"
      value={data ?? ''}
      onChange={handleInputChange}
      disabled={isDisabled}
      min={min}
      max={max}
      step={step}
      className={
        surface === 'bar'
          ? 'w-14 border-0 bg-transparent p-0 text-xs font-medium tabular-nums text-foreground outline-none disabled:cursor-not-allowed'
          : fieldNumberClass(scale, hasError)
      }
    />
  );

  // In the action bar the label and the input share one capsule; in a form they
  // are a settings row, the name on the left and the stepper on the right.
  if (surface === 'bar') {
    return (
      <div
        className={`ss-jsonforms-field ss-jsonforms-number ${pillClass({
          hasError,
          disabled: isDisabled,
        })}`}
        title={tooltip || undefined}
      >
        {label && (
          <label
            htmlFor={`number-${path}`}
            className={`${pillLabelClass} whitespace-nowrap ${
              hasError ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        {input}
      </div>
    );
  }

  return (
    <div className="ss-jsonforms-field ss-jsonforms-number">
      <div className={fieldRowClass}>
        <label htmlFor={`number-${path}`} className={fieldRowLabelClass(scale)}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
        {input}
      </div>
      {hasError && <div className={fieldErrorClass}>{errors}</div>}
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
