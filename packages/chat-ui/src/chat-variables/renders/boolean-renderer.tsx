import type { ControlElement, JsonSchema7 } from '@jsonforms/core';
import { rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Globe, SlidersHorizontal, Zap } from 'lucide-react';
import React, { useCallback } from 'react';

import {
  fieldErrorClass,
  fieldRowClass,
  fieldRowLabelClass,
  pillClass,
  pillLabelClass,
  scaleFor,
  switchThumbClass,
  switchTrackClass,
  type FieldSurface,
} from './fieldStyles';

type AccessUiSchema = { access?: 'Read' | 'Write' };

/**
 * Pick the icon the way the reference design does — it gives web search a globe
 * and streaming a bolt. Workspace variables are author-defined, so anything we
 * don't recognise falls back to a neutral "option" glyph, which keeps every
 * pill the same shape rather than leaving some of them narrower.
 */
function iconFor(label: string | undefined) {
  const name = (label ?? '').toLowerCase();
  if (/search|web|browse|internet/.test(name)) return Globe;
  if (/stream/.test(name)) return Zap;
  return SlidersHorizontal;
}

/**
 * A boolean workspace variable. In the composer's action bar it is the design's
 * toggle pill — a capsule that fills with a tint of the accent when it is on,
 * its label collapsing away below `sm` so a row of them still fits a 320px
 * phone. Everywhere else it is a settings row: the name on the left, the
 * design's switch on the right, so it lines up with the fields beside it
 * instead of sitting among them as a stray capsule.
 */
const BooleanRenderer: React.FC<import('@jsonforms/core').ControlProps> = ({
  data,
  handleChange,
  path,
  label,
  description,
  errors,
  uischema,
  visible,
  enabled,
  config,
}) => {
  const onToggle = useCallback(() => {
    handleChange(path, !data);
  }, [handleChange, path, data]);

  if (!visible) return null;

  // Read-only if ui schema set access: 'Read'
  const readOnly =
    (uischema as unknown as AccessUiSchema | undefined)?.access === 'Read';
  const isDisabled = !enabled || readOnly;

  const hasError = !!errors && errors.length > 0;
  const isChecked = Boolean(data);
  const Icon = iconFor(label);
  const surface =
    ((config ?? {}) as { surface?: FieldSurface }).surface ?? 'form';
  const scale = scaleFor(surface);

  // The description and any validation message ride along as the native
  // tooltip; an extra block of text would break the single-row action bar.
  const tooltip = [label, description, hasError ? errors : null]
    .filter(Boolean)
    .join(' — ');

  const toggle = (
    <button
      id={`toggle-${path}`}
      type="button"
      role={surface === 'bar' ? undefined : 'switch'}
      aria-pressed={surface === 'bar' ? isChecked : undefined}
      aria-checked={surface === 'bar' ? undefined : isChecked}
      aria-label={label}
      title={tooltip || undefined}
      onClick={onToggle}
      disabled={isDisabled}
      // Blur after *pointer* interaction so the focus ring doesn't linger;
      // keyboard focus stays visible.
      onPointerUp={(e: React.PointerEvent<HTMLButtonElement>) => {
        if (
          e.pointerType === 'mouse' ||
          e.pointerType === 'touch' ||
          e.pointerType === 'pen'
        ) {
          e.currentTarget.blur();
        }
      }}
      className={
        surface === 'bar'
          ? `boolean-switch ${pillClass({
              active: isChecked,
              hasError,
              disabled: isDisabled,
            })}`
          : switchTrackClass(isChecked, isDisabled)
      }
    >
      {surface === 'bar' ? (
        <>
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {label && (
            // Desktop-first: the app and the package each ship a full Tailwind
            // build, so a base `hidden` can out-order `sm:inline`.
            // `max-sm:hidden` is the form that survives both cascades.
            <span className={`inline ${pillLabelClass} max-sm:hidden`}>
              {label}
            </span>
          )}
        </>
      ) : (
        <span className={switchThumbClass(isChecked)} />
      )}
    </button>
  );

  if (surface === 'bar') return toggle;

  return (
    <div className="ss-jsonforms-field ss-jsonforms-boolean">
      <div className={fieldRowClass}>
        <label htmlFor={`toggle-${path}`} className={fieldRowLabelClass(scale)}>
          {label}
        </label>
        {toggle}
      </div>
      {hasError && <div className={fieldErrorClass}>{errors}</div>}
    </div>
  );
};

// Match boolean fields
export const booleanRendererTester = rankWith(40, (uischema, schema) => {
  if (uischema.type !== 'Control') return false;
  const scope = (uischema as ControlElement).scope;
  const propertyPath = scope.replace('#/properties/', '');
  const fieldSchema = (schema as JsonSchema7 | undefined)?.properties?.[
    propertyPath
  ] as JsonSchema7 | undefined;
  return fieldSchema?.type === 'boolean';
});

export const BooleanRendererControl =
  withJsonFormsControlProps(BooleanRenderer);
