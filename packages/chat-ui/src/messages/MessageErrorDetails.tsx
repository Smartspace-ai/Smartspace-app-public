import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

/**
 * Disclosure under an error bubble that reveals the provider detail on
 * demand. Collapsed by default, so the friendly copy (see
 * `getMessageErrorText`) stays the only thing shown until a reader
 * chooses to look closer.
 */
export function MessageErrorDetails({ detail }: { detail: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1">
      {/* Explicit button-chrome reset: host apps (e.g. the Admin Sandbox)
          may not ship a Tailwind preflight, so unset properties would
          otherwise fall back to the browser's default button box. */}
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
