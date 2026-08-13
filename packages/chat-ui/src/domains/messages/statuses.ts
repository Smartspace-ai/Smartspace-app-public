/**
 * Structured transient statuses carried on a message's `status` value.
 *
 * Historically the `status` value is a plain string rendered verbatim in the
 * transient status bubble. The backend's LLM retry loop additionally emits a
 * structured payload — `{"type": "retry", attempt, max_attempts,
 * delay_seconds, error_code}` — so the UI can say *why* the response is
 * paused instead of freezing silently through a backoff wait. Anything that
 * doesn't parse as a known structured status falls back to today's
 * plain-string behaviour.
 */

export type RetryStatus = {
  type: 'retry';
  attempt: number;
  maxAttempts: number;
  delaySeconds?: number;
  errorCode?: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string' && value.trimStart().startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(value);
      return asRecord(parsed);
    } catch {
      return null;
    }
  }
  return null;
};

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/**
 * Parse a `status` value into a RetryStatus, or null when it's not one.
 * Accepts both camelCase and snake_case field spellings (the payload
 * originates in the Python ai-api and may be relayed verbatim).
 */
export const parseRetryStatus = (value: unknown): RetryStatus | null => {
  const record = asRecord(value);
  if (!record || record['type'] !== 'retry') return null;

  const attempt = asNumber(record['attempt']);
  const maxAttempts =
    asNumber(record['maxAttempts']) ?? asNumber(record['max_attempts']);
  if (attempt === undefined || maxAttempts === undefined) return null;

  const delaySeconds =
    asNumber(record['delaySeconds']) ?? asNumber(record['delay_seconds']);
  const rawErrorCode = record['errorCode'] ?? record['error_code'];

  return {
    type: 'retry',
    attempt,
    maxAttempts,
    delaySeconds,
    errorCode: typeof rawErrorCode === 'string' ? rawErrorCode : undefined,
  };
};

const RETRY_REASON_TEXT: Record<string, string> = {
  'llm.rate_limit': 'the model is busy',
  'llm.timeout': 'the model took too long',
  'llm.transient_connection': 'the connection dropped',
  'llm.server_error': 'the model provider had a problem',
};

export const getRetryStatusText = (status: RetryStatus): string => {
  const reason = status.errorCode
    ? RETRY_REASON_TEXT[status.errorCode]
    : undefined;
  const waiting =
    status.delaySeconds && status.delaySeconds >= 1
      ? ` (waiting ~${Math.round(status.delaySeconds)}s)`
      : '';
  return `${
    reason ? `Hit a snag — ${reason}. ` : 'Hit a snag. '
  }Retrying, attempt ${status.attempt + 1} of ${status.maxAttempts}${waiting}…`;
};
