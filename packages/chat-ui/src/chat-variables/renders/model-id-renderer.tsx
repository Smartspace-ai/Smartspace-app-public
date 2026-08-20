import type {
  ControlElement,
  ControlProps,
  JsonSchema7,
} from '@jsonforms/core';
import { rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Check, ChevronDown, Cpu, Loader2 } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getModelIcon, type Model, useModels } from '@/domains/models';

import {
  fieldLabelClass,
  fieldTriggerClass,
  pillClass,
  pillValueClass,
  popoverRowClass,
  POPOVER_MAX_HEIGHT_PX,
  POPOVER_WIDTH_PX,
  scaleFor,
  type FieldSurface,
} from './fieldStyles';
import { useAnchoredPopover } from './useAnchoredPopover';

type AccessUiSchema = { access?: 'Read' | 'Write' };

/**
 * The model selector, shaped as the reference design's composer pill: a
 * bordered capsule showing the provider glyph and the model name, which opens a
 * popover above the composer.
 *
 * It replaces an MUI `Autocomplete` whose colours were hard-coded, so it kept a
 * near-white background in dark mode and squeezed the name down to a couple of
 * characters inside the action bar. The list keeps our server-side search —
 * the reference only ever had a short mock array to show.
 */
const ModelIdRenderer: React.FC<ControlProps> = ({
  data,
  handleChange,
  path,
  enabled,
  label,
  description,
  errors,
  uischema,
  visible,
  config,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const surface =
    ((config ?? {}) as { surface?: FieldSurface }).surface ?? 'bar';
  const scale = scaleFor(surface);
  const isBar = surface === 'bar';

  const {
    isOpen,
    close: closeMenu,
    toggle,
    renderPopover,
  } = useAnchoredPopover({
    trigger: triggerRef,
    popover: menuRef,
    // Wide enough for a provider glyph, a model name and its id underneath.
    width: POPOVER_WIDTH_PX,
    maxHeight: POPOVER_MAX_HEIGHT_PX,
    role: 'listbox',
    label: 'Models',
  });
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Debounce search to prevent excessive API calls
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 300);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue]);

  const searchTerm = debouncedSearchValue || undefined;

  const { data: modelsData, isLoading } = useModels({
    search: searchTerm,
    take: 1000,
  });

  const listModels = useMemo<Model[]>(() => {
    const rows = modelsData?.data;
    if (!rows) return [];
    return [...rows].sort((a, b) => {
      const aName = (a.displayName || a.name || '').toLowerCase();
      const bName = (b.displayName || b.name || '').toLowerCase();
      if (aName < bName) return -1;
      if (aName > bName) return 1;
      return 0;
    });
  }, [modelsData?.data]);

  const selectedModel =
    typeof data === 'string' && data && listModels.length
      ? listModels.find((model) => model.id === data)
      : null;

  const handleSelect = useCallback(
    (model: Model) => {
      handleChange(path, model.id);
      setSearchValue('');
      setDebouncedSearchValue('');
      closeMenu();
    },
    [handleChange, path, closeMenu]
  );

  // Clear a stale filter once the list is gone, so it reopens on the full set.
  useEffect(() => {
    if (!isOpen) setSearchValue('');
  }, [isOpen]);

  // Send focus into the filter as soon as the list appears.
  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  if (!visible) return null;

  const readOnly =
    (uischema as unknown as AccessUiSchema | undefined)?.access === 'Read';
  const isDisabled = !enabled || readOnly;
  const hasError = !!errors && errors.length > 0;

  const selectedName = selectedModel
    ? selectedModel.displayName || selectedModel.name || ''
    : '';
  const triggerText = selectedName || 'Select model';
  const iconSrc = getModelIcon(selectedModel);

  const tooltip = [selectedName || label, description, hasError ? errors : null]
    .filter(Boolean)
    .join(' — ');

  // `ModelId` is the schema title this renderer is detected by, not a name to
  // put in front of anyone.
  const triggerLabel = !label || label === 'ModelId' ? 'Model' : label;

  const trigger = (
    <button
      ref={triggerRef}
      id={`${path}-trigger`}
      type="button"
      onClick={toggle}
      disabled={isDisabled}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-label={triggerLabel}
      title={tooltip || undefined}
      className={
        isBar
          ? pillClass({ active: isOpen, hasError, disabled: isDisabled })
          : fieldTriggerClass(scale, hasError)
      }
    >
      {iconSrc ? (
        <img
          src={iconSrc}
          alt=""
          className="h-3.5 w-3.5 shrink-0 object-contain"
        />
      ) : (
        <Cpu className="h-3.5 w-3.5 shrink-0" />
      )}
      {/* Desktop-first: a base `hidden` can lose to `sm:inline` because the
          app and the package each ship a full Tailwind build. */}
      <span
        className={
          isBar
            ? `inline ${pillValueClass} max-sm:hidden`
            : 'min-w-0 flex-1 truncate'
        }
      >
        {triggerText}
      </span>
      <ChevronDown
        className={`shrink-0 opacity-60 ${isBar ? 'h-3 w-3' : 'h-4 w-4'}`}
      />
    </button>
  );

  return (
    <div
      className={
        isBar
          ? 'ss-jsonforms-field ss-jsonforms-model relative shrink-0'
          : 'ss-jsonforms-field ss-jsonforms-model compact-field'
      }
    >
      {!isBar && (
        <label htmlFor={`${path}-trigger`} className={fieldLabelClass(scale)}>
          {triggerLabel}
        </label>
      )}

      {trigger}

      {renderPopover(
        <>
          <div className="shrink-0 border-b border-border p-2">
            <input
              ref={searchRef}
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search models…"
              aria-label="Search models"
              className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40"
            />
          </div>

          <div className="min-h-0 overflow-y-auto">
            {isLoading && listModels.length === 0 && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}

            {!isLoading && listModels.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {searchValue ? 'No models found' : 'No models available'}
              </p>
            )}

            {listModels.map((model) => {
              const active = model.id === selectedModel?.id;
              const optionIcon = getModelIcon(model);
              return (
                <button
                  key={model.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => handleSelect(model)}
                  className={popoverRowClass}
                >
                  <Check
                    className={`h-3.5 w-3.5 shrink-0 ${
                      active ? 'text-primary' : 'opacity-0'
                    }`}
                  />
                  {optionIcon ? (
                    <img
                      src={optionIcon}
                      alt=""
                      className="h-4 w-4 shrink-0 object-contain"
                    />
                  ) : (
                    <Cpu className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm leading-none text-foreground">
                      {model.displayName || model.name}
                    </span>
                    {model.displayName && model.name !== model.displayName && (
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {model.name}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// Create the tester function for JSON Forms
export const modelIdRendererTester = rankWith(
  100, // Much higher rank to ensure it takes priority
  (uischema, schema) => {
    // Check if this is a Control element (individual field)
    if (uischema.type !== 'Control') {
      return false;
    }

    // Extract the property path from the scope (e.g., "#/properties/Model" -> "Model")
    const propertyPath = (uischema as ControlElement).scope.replace(
      '#/properties/',
      ''
    );

    // Get the individual field schema from the root schema
    const fieldSchema = (schema as JsonSchema7 | undefined)?.properties?.[
      propertyPath
    ] as JsonSchema7 | undefined;

    if (!fieldSchema) {
      return false;
    }

    // Check if this field has the ModelId indicators
    const hasModelSelector =
      typeof fieldSchema === 'object' &&
      fieldSchema &&
      (fieldSchema as unknown as Record<string, unknown>)[
        'x-model-selector'
      ] === true;
    const hasModelIdTitle = fieldSchema.title === 'ModelId';
    const result = hasModelIdTitle || hasModelSelector;

    return result;
  }
);

// Export the wrapped component
export const ModelIdRendererControl =
  withJsonFormsControlProps(ModelIdRenderer);
