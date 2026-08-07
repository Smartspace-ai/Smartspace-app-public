import type { ControlElement, JsonSchema7 } from '@jsonforms/core';
import { rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Globe, SlidersHorizontal, Zap } from 'lucide-react';
import React, { useCallback } from 'react';

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
 * A boolean workspace variable, rendered as the composer action bar's toggle
 * pill: a bordered capsule that fills with a tint of the accent when it is on.
 * The label collapses away below `sm` so a row of these still fits a 320px
 * phone — the icon plus `aria-label` carry the meaning there.
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

  // The description and any validation message ride along as the native
  // tooltip; an extra block of text would break the single-row action bar.
  const tooltip = [label, description, hasError ? errors : null]
    .filter(Boolean)
    .join(' — ');

  return (
    <button
      id={`toggle-${path}`}
      type="button"
      aria-pressed={isChecked}
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
      className={`boolean-switch flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isChecked
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-transparent bg-transparent text-muted-foreground hover:bg-secondary'
      } ${hasError ? 'border-destructive text-destructive' : ''} ${
        isDisabled ? 'cursor-not-allowed opacity-60' : ''
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label && (
        // Desktop-first: the app and the package each ship a full Tailwind
        // build, so a base `hidden` can out-order `sm:inline`. `max-sm:hidden`
        // is the form that survives both cascades.
        <span className="inline max-w-[9rem] truncate max-sm:hidden">
          {label}
        </span>
      )}
    </button>
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
