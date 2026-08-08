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
import { createPortal } from 'react-dom';

import { getModelIcon, type Model, useModels } from '@/domains/models';

type AccessUiSchema = { access?: 'Read' | 'Write' };

/** Gap between the trigger capsule and the floating menu. */
const MENU_GAP = 8;
/** Breathing room kept between the menu and the edge of the viewport. */
const VIEWPORT_MARGIN = 8;
/** Search field + a comfortable run of options; the menu never exceeds this. */
const MAX_MENU_HEIGHT = 336;
/**
 * Below this there isn't room for the filter and a usable number of options, so
 * the menu flips to whichever side has more space rather than opening above.
 */
const MIN_MENU_HEIGHT = 180;

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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
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
      setIsOpen(false);
    },
    [handleChange, path]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchValue('');
  }, []);

  // Dismissal: an outside pointer press, the affordance the reference uses, plus
  // Escape. Both live on the document so no wrapper element has to carry a
  // keyboard handler it has no interactive role for.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      // The list is portaled to <body> (see below), so "inside" spans two
      // subtrees: the trigger capsule and the floating menu.
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(menuRef.current && menuRef.current.contains(target))
      ) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    // The floating menu is anchored to a rect read at render time; a resize
    // invalidates it, so just dismiss rather than track.
    const onResize = () => close();
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen, close]);

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
  const triggerText = selectedName || label || 'Select model';
  const iconSrc = getModelIcon(selectedModel);

  const tooltip = [selectedName || label, description, hasError ? errors : null]
    .filter(Boolean)
    .join(' — ');

  // Anchor for the floating menu, read per render while open. The trigger can't
  // move without something re-rendering this component (open/close, typing in
  // the filter, selecting), and a window resize dismisses the menu outright.
  const anchorRect = isOpen
    ? containerRef.current?.getBoundingClientRect()
    : undefined;

  // The menu opens upward by design, but its height was fixed while the space
  // above the trigger is not: on a new thread the composer sits centred in the
  // canvas rather than at the foot of it, leaving too little room, and the top
  // of the list ran off the screen — unreachable, since the clipped part is
  // outside the scroll container. Measure the space instead, cap the menu to it,
  // and flip below when above is too cramped to be useful.
  const spaceAbove = anchorRect
    ? anchorRect.top - MENU_GAP - VIEWPORT_MARGIN
    : 0;
  const spaceBelow = anchorRect
    ? window.innerHeight - anchorRect.bottom - MENU_GAP - VIEWPORT_MARGIN
    : 0;
  const openAbove = spaceAbove >= MIN_MENU_HEIGHT || spaceAbove >= spaceBelow;
  const menuMaxHeight = Math.max(
    0,
    Math.min(MAX_MENU_HEIGHT, openAbove ? spaceAbove : spaceBelow)
  );

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={isDisabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label || 'Select model'}
        title={tooltip || undefined}
        className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isOpen
            ? 'border-primary/30 bg-primary/10 text-primary'
            : 'border-border/70 bg-transparent text-muted-foreground hover:bg-secondary'
        } ${hasError ? 'border-destructive text-destructive' : ''} ${
          isDisabled ? 'cursor-not-allowed opacity-60' : ''
        }`}
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
        <span className="inline max-w-[9rem] truncate max-sm:hidden">
          {triggerText}
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
      </button>

      {/* Portaled to <body> with fixed positioning: inside the composer the
          menu sits under `.chat-composer`'s `overflow-hidden`, which clips a
          list opening upward at the composer's rounded frame. Floating it
          keeps the capsule in the action bar but lets the list stack cleanly
          above the composer. */}
      {isOpen &&
        anchorRect &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={label || 'Models'}
            className="fixed z-50 flex w-72 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
            style={{
              left: Math.max(
                VIEWPORT_MARGIN,
                Math.min(
                  anchorRect.left,
                  window.innerWidth - 288 - VIEWPORT_MARGIN
                )
              ),
              ...(openAbove
                ? { bottom: window.innerHeight - anchorRect.top + MENU_GAP }
                : { top: anchorRect.bottom + MENU_GAP }),
              maxHeight: menuMaxHeight,
            }}
          >
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

            <div className="min-h-0 flex-1 overflow-y-auto">
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
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-secondary/60"
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
                      {model.displayName &&
                        model.name !== model.displayName && (
                          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                            {model.name}
                          </span>
                        )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
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
