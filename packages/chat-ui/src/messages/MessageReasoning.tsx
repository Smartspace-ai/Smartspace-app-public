import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { MessageMarkdown } from '@/shared/markdown/MessageMarkdown';

/**
 * A model's reasoning for one LLM call, from a flow output named `reasoning`.
 * Collapsed by default, so the answer stays the first thing a reader sees.
 */
export function MessageReasoning({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-1">
      {/* Explicit button-chrome reset, as in MessageErrorDetails: host apps
          (e.g. the Admin Sandbox) may not ship a Tailwind preflight. */}
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
        {expanded ? 'Hide reasoning' : 'Show reasoning'}
      </button>
      {expanded && (
        <div className="mt-1.5 rounded-md bg-secondary/60 p-2 text-[13px] text-muted-foreground">
          <MessageMarkdown value={text} />
        </div>
      )}
    </div>
  );
}

export default MessageReasoning;
