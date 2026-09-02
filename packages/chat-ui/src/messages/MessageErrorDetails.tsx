import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

/**
 * Optional disclosure under an error bubble — the bubble itself always shows
 * the friendly, category-based copy (see `getMessageErrorText`); this reveals
 * the actual provider detail on demand, for admin/debugging surfaces (the
 * Sandbox) only. Collapsed by default so the friendly copy stays the one
 * thing every reader sees.
 */
export function MessageErrorDetails({ detail }: { detail: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1">
      {/* Reset every native <button> chrome property explicitly (background,
          border, padding, sizing) rather than relying on a global Tailwind
          preflight to strip it — this renders inside host apps (e.g. the
          Admin Sandbox) that don't ship one, and unset properties fall back
          to the browser's default button box otherwise. */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="m-0 inline-flex w-auto cursor-pointer appearance-none items-center gap-1 border-0 bg-transparent p-0 text-[11px] font-medium leading-none text-muted-foreground hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        {expanded ? 'Hide details' : 'Show details'}
      </button>
      {expanded && (
        <div className="mt-1.5 whitespace-pre-wrap break-words rounded-md bg-secondary/60 p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {detail}
        </div>
      )}
    </div>
  );
}

export default MessageErrorDetails;
