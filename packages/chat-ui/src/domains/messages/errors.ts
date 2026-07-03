/**
 * User-facing text for message errors.
 *
 * The backend attaches a stable machine-readable category to LLM failures
 * (`errorCode`, e.g. "llm.rate_limit") alongside the numeric HTTP `code`.
 * Prefer the category — it distinguishes causes the HTTP code can't (a 400
 * can be a content filter, a context-window blowout, or a malformed
 * request), and it's the key a translation layer maps from. The numeric
 * fallback keeps older messages and not-yet-upgraded backends readable.
 */

const GENERIC_ERROR_TEXT =
  '⚠️ **Error**\n\nAn unexpected error occurred. Please try again.';

const ERROR_CODE_TEXT: Record<string, string> = {
  'llm.rate_limit':
    "⚠️ **The model is receiving too many requests**\n\nI'm being rate limited right now. Please wait a moment and try again.",
  'llm.timeout':
    '⚠️ **The model took too long to respond**\n\nPlease try again. If this keeps happening, try a shorter question.',
  'llm.transient_connection':
    '⚠️ **The connection to the model was interrupted**\n\nThis is usually temporary. Please try again.',
  'llm.upstream_error':
    '⚠️ **The model provider had a problem**\n\nPlease try again in a moment.',
  'llm.auth':
    "⚠️ **The model connection isn't authorised**\n\nAn administrator needs to check the model configuration.",
  'llm.not_found':
    '⚠️ **The model or deployment could not be found**\n\nAn administrator needs to check the model configuration.',
  'llm.invalid_request':
    '⚠️ **The request was rejected by the model provider**\n\nPlease try rephrasing your message.',
  'llm.context_window':
    '⚠️ **This conversation is too long for the model**\n\nPlease start a new thread, or ask a shorter question.',
  'llm.content_policy':
    '⚠️ **The response was blocked by a content filter**\n\nPlease rephrase your request.',
  'llm.schema_validation':
    '⚠️ **The model returned an invalid response**\n\nPlease try again.',
  'llm.unknown': GENERIC_ERROR_TEXT,
};

const STATUS_CODE_TEXT: Record<number, string> = {
  408: ERROR_CODE_TEXT['llm.timeout'],
  429: ERROR_CODE_TEXT['llm.rate_limit'],
  401: ERROR_CODE_TEXT['llm.auth'],
  403: ERROR_CODE_TEXT['llm.auth'],
  404: ERROR_CODE_TEXT['llm.not_found'],
  500: ERROR_CODE_TEXT['llm.upstream_error'],
  502: ERROR_CODE_TEXT['llm.upstream_error'],
  503: ERROR_CODE_TEXT['llm.transient_connection'],
  504: ERROR_CODE_TEXT['llm.timeout'],
};

export type MessageErrorLike =
  | number
  | { code: number; errorCode?: string | null };

export const getMessageErrorText = (error: MessageErrorLike): string => {
  if (typeof error === 'number') {
    return STATUS_CODE_TEXT[error] ?? GENERIC_ERROR_TEXT;
  }
  if (error.errorCode && ERROR_CODE_TEXT[error.errorCode]) {
    return ERROR_CODE_TEXT[error.errorCode];
  }
  return STATUS_CODE_TEXT[error.code] ?? GENERIC_ERROR_TEXT;
};
