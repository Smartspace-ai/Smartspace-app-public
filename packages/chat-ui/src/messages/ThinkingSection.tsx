import { FC } from 'react';

interface ThinkingSectionProps {
  /**
   * The flow's current status line — typically a tool narrating itself
   * ("Searching the web"). Tool statuses share this one section rather than
   * printing on their own line below the answer; when the flow hasn't
   * reported one we fall back to the generic waiting label.
   */
  status?: string | null;
  /**
   * True once the message has painted assistant output. Switches the
   * generic label from "Thinking…" to "Still working…", since the flow is
   * now producing more output rather than starting.
   */
  hasOutput?: boolean;
}

/**
 * The single "the assistant is working" affordance. Owned by `MessageItem`,
 * which shows it for as long as the message's flow is running — see the
 * `showThinking` gate there.
 */
export const ThinkingSection: FC<ThinkingSectionProps> = ({
  status,
  hasOutput = false,
}) => (
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
      {status?.trim() ? status : hasOutput ? 'Still working…' : 'Thinking…'}
    </span>
  </div>
);
