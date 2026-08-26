import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { popoverClass } from './fieldStyles';

/** Clearance from the trigger and from the edges of the viewport. */
const GAP_PX = 8;
/** A trigger-width list still has to be readable: in the action bar the trigger
 *  shrinks to its value, which is often narrower than the options it holds. */
const MIN_TRIGGER_WIDTH_PX = 224;
/** Below this there is no room for a filter and a usable run of options, so the
 *  panel drops below the trigger instead of opening above it. */
const MIN_PANEL_HEIGHT_PX = 180;

type NestedRegistry = {
  register: (el: HTMLElement) => void;
  unregister: (el: HTMLElement) => void;
};

/**
 * Every popover portals to `<body>`, so one opened from inside another is a DOM
 * sibling rather than a descendant. Without this the outer panel reads a
 * mousedown on the inner list as an outside click and dismisses — unmounting
 * that list before its `click` can land, so the option a user picked is
 * silently dropped. Each popover registers its own element with the chain above
 * it, and an ancestor counts a registered descendant's subtree as its own.
 */
const NestedPopoverContext = React.createContext<NestedRegistry | null>(null);

type Params = {
  trigger: React.RefObject<HTMLElement | null>;
  popover: React.RefObject<HTMLElement | null>;
  /** A fixed width, or the trigger's own width — what a select does. */
  width: number | 'trigger';
  maxHeight: number;
  /** Announced on the floating element. */
  role: 'listbox' | 'dialog';
  label?: string;
};

/**
 * A list or panel floating above a trigger in the composer.
 *
 * Portaled to `<body>` and positioned `fixed`, because inside the composer
 * `.chat-composer`'s `overflow-hidden` clips anything opening upward at its
 * rounded frame. The anchor rect is read at render time — the trigger can't move
 * without something re-rendering the owner, and a resize dismisses outright
 * rather than tracking it.
 */
export function useAnchoredPopover({
  trigger,
  popover,
  width,
  maxHeight,
  role,
  label,
}: Params) {
  const [isOpen, setIsOpen] = useState(false);

  const parentRegistry = useContext(NestedPopoverContext);
  const descendants = useRef(new Set<HTMLElement>());

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((open) => !open), []);

  // Ours to track, and the chain above ours to be told about.
  const registry = useMemo<NestedRegistry>(
    () => ({
      register: (el) => {
        descendants.current.add(el);
        parentRegistry?.register(el);
      },
      unregister: (el) => {
        descendants.current.delete(el);
        parentRegistry?.unregister(el);
      },
    }),
    [parentRegistry]
  );

  // Announce our own panel to that chain for as long as it is open.
  useEffect(() => {
    if (!isOpen || !parentRegistry) return;
    const el = popover.current;
    if (!el) return;
    parentRegistry.register(el);
    return () => parentRegistry.unregister(el);
  }, [isOpen, parentRegistry, popover]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      // "Inside" spans the trigger, the portaled panel, and any popover opened
      // from within it — see `NestedPopoverContext`.
      if (trigger.current?.contains(target)) return;
      if (popover.current?.contains(target)) return;
      for (const el of descendants.current) {
        if (el.contains(target)) return;
      }
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', close);
    };
  }, [isOpen, close, trigger, popover]);

  const renderPopover = (children: React.ReactNode) => {
    if (!isOpen) return null;
    const anchor = trigger.current?.getBoundingClientRect();
    if (!anchor) return null;

    const panelWidth =
      width === 'trigger'
        ? Math.max(anchor.width, MIN_TRIGGER_WIDTH_PX)
        : width;

    // It opens upward by default, but the space above the trigger is not fixed:
    // on a new thread the composer sits centred in the canvas rather than at the
    // foot of it. Measure both sides, cap the panel to the room it actually has,
    // and drop below when above is too cramped — a panel taller than its own
    // room runs off the top of the viewport, and the part that overflows sits
    // outside the scroll container, so nothing can bring it back.
    const spaceAbove = anchor.top - GAP_PX * 2;
    const spaceBelow = window.innerHeight - anchor.bottom - GAP_PX * 2;
    const openAbove =
      spaceAbove >= MIN_PANEL_HEIGHT_PX || spaceAbove >= spaceBelow;
    const panelMaxHeight = Math.max(
      0,
      Math.min(maxHeight, openAbove ? spaceAbove : spaceBelow)
    );

    return createPortal(
      <div
        ref={popover as React.RefObject<HTMLDivElement>}
        role={role}
        aria-label={label}
        className={`fixed z-50 ${popoverClass}`}
        style={{
          width: panelWidth,
          maxWidth: `calc(100vw - ${GAP_PX * 4}px)`,
          left: Math.max(
            GAP_PX,
            Math.min(anchor.left, window.innerWidth - panelWidth - GAP_PX)
          ),
          ...(openAbove
            ? { bottom: window.innerHeight - anchor.top + GAP_PX }
            : { top: anchor.bottom + GAP_PX }),
          maxHeight: panelMaxHeight,
        }}
      >
        <NestedPopoverContext.Provider value={registry}>
          {children}
        </NestedPopoverContext.Provider>
      </div>,
      document.body
    );
  };

  return { isOpen, close, toggle, renderPopover };
}
