import { SlidersHorizontal, X } from 'lucide-react';
import React, { useRef } from 'react';

import {
  POPOVER_MAX_HEIGHT_PX,
  POPOVER_WIDTH_PX,
  popoverHeadingClass,
} from './renders/fieldStyles';
import { useAnchoredPopover } from './renders/useAnchoredPopover';

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
 *
 * The panel takes the design's popover metrics, the same ones its model picker
 * uses: 288px wide, 288px tall at most, scrolling inside.
 */
export function VariablesOverflowPanel({ count, children }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { isOpen, close, toggle, renderPopover } = useAnchoredPopover({
    trigger: triggerRef,
    popover: panelRef,
    width: POPOVER_WIDTH_PX,
    maxHeight: POPOVER_MAX_HEIGHT_PX,
    role: 'dialog',
    label: 'Workspace variables',
  });

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
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

      {renderPopover(
        <>
          <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
            <span className={popoverHeadingClass}>Variables</span>
            <button
              type="button"
              onClick={close}
              aria-label="Close variables"
              className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="ss-variables-panel min-h-0 overflow-y-auto p-3">
            {children}
          </div>
        </>
      )}
    </>
  );
}
