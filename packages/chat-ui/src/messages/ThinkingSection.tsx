import { FC } from 'react';

interface ThinkingSectionProps {
  /**
   * The flow's current status line — typically a tool narrating itself
   * ("Searching the web"). Tool statuses share this one section rather than
   * printing on their own line below the answer; when the flow hasn't
   * reported one we fall back to the generic waiting label.
   */
  status?: string | null;
}

/**
 * The single "the assistant is working" affordance. Owned by `MessageItem`
 * so the same place that knows whether output has started printing also
 * decides whether this shows — see the `showThinking` gate there.
 */
export const ThinkingSection: FC<ThinkingSectionProps> = ({ status }) => (
  <div
    className="flex items-center gap-2 py-2 text-[13px]"
    role="status"
    aria-live="polite"
  >
    <span className="chat-thinking-dots" aria-hidden>
      <span />
      <span />
      <span />
    </span>
    <span className="chat-thinking-shimmer">
      {status?.trim() ? status : 'Thinking…'}
    </span>
  </div>
);
