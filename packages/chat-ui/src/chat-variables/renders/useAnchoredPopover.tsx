import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { popoverClass } from './fieldStyles';

/** Clearance from the trigger and from the edges of the viewport. */
const GAP_PX = 8;
/** A trigger-width list still has to be readable: in the action bar the trigger
 *  shrinks to its value, which is often narrower than the options it holds. */
const MIN_TRIGGER_WIDTH_PX = 224;

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

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((open) => !open), []);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      // "Inside" spans two subtrees: the trigger and the portaled panel.
      if (
        trigger.current &&
        !trigger.current.contains(target) &&
        !(popover.current && popover.current.contains(target))
      ) {
        close();
      }
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
          bottom: window.innerHeight - anchor.top + GAP_PX,
          // It opens upward, so it has at most the room between the trigger and
          // the top of the viewport — and not all of that: one running the full
          // height of a tall window reads as a page rather than a control.
          // Past this the content scrolls inside it.
          maxHeight: Math.min(
            maxHeight,
            Math.max(120, anchor.top - GAP_PX * 2)
          ),
        }}
      >
        {children}
      </div>,
      document.body
    );
  };

  return { isOpen, close, toggle, renderPopover };
}
