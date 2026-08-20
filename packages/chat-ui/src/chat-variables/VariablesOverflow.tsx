import { SlidersHorizontal, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const PANEL_WIDTH_PX = 320;
/** Clearance from the trigger and from the edges of the viewport. */
const PANEL_GAP_PX = 8;
const PANEL_MAX_HEIGHT_PX = 420;

type Props = {
  /** How many variables the panel holds, shown on the trigger. */
  count: number;
  children: React.ReactNode;
};

/**
 * The action bar's overflow for workspace variables: one pill that opens the
 * rest of them in a panel above the composer.
 *
 * A workspace can define any number of variables, and inline they wrapped into
 * row after row of controls — the composer grew a block of settings taller than
 * the message being written. Only the few that get touched mid-conversation
 * stay in the bar now; everything else lives one click away.
 */
export function VariablesOverflowPanel({ count, children }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  // Same dismissal contract as the model pill: an outside press, Escape, and a
  // resize — the panel is anchored to a rect read at render time, so rather
  // than track the trigger it steps aside when the viewport changes.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        !(panelRef.current && panelRef.current.contains(target))
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
  }, [isOpen, close]);

  const anchorRect = isOpen
    ? triggerRef.current?.getBoundingClientRect()
    : undefined;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Variables (${count})`}
        className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isOpen
            ? 'border-primary/30 bg-primary/10 text-primary'
            : 'border-border/70 bg-transparent text-muted-foreground hover:bg-secondary'
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
        {/* Desktop-first: a base `hidden` can lose to `sm:inline` because the
            app and the package each ship a full Tailwind build. */}
        <span className="inline max-sm:hidden">Variables</span>
        <span className="rounded-full bg-secondary px-1.5 text-[10px] leading-4 tabular-nums">
          {count}
        </span>
      </button>

      {/* Portaled to <body> with fixed positioning: inside the composer the
          panel would sit under `.chat-composer`'s `overflow-hidden`, which
          clips anything opening upward at the composer's rounded frame. */}
      {isOpen &&
        anchorRect &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Workspace variables"
            className="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
            style={{
              width: PANEL_WIDTH_PX,
              maxWidth: `calc(100vw - ${PANEL_GAP_PX * 4}px)`,
              left: Math.max(
                PANEL_GAP_PX,
                Math.min(
                  anchorRect.left,
                  window.innerWidth - PANEL_WIDTH_PX - PANEL_GAP_PX
                )
              ),
              bottom: window.innerHeight - anchorRect.top + PANEL_GAP_PX,
              // The panel opens upward, so it has at most the room between
              // the trigger and the top of the viewport — and not even all of
              // that: one running the full height of a tall window reads as a
              // page rather than a control. Past this the fields scroll inside
              // it instead.
              maxHeight: Math.min(
                PANEL_MAX_HEIGHT_PX,
                Math.max(120, anchorRect.top - PANEL_GAP_PX * 2)
              ),
            }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-semibold text-foreground">
                Variables
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close variables"
                className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="ss-variables-panel min-h-0 overflow-y-auto p-3">
              {children}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
