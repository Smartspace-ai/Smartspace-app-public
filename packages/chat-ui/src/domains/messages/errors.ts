/**
 * User-facing text for message errors.
 *
 * The backend attaches a stable machine-readable category to failures
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
  'llm.unsupported_modality':
    "⚠️ **This model can't read images**\n\nSwitch to a vision-capable model, or remove the attachment and describe it instead.",
  'llm.unknown': GENERIC_ERROR_TEXT,
  // The AI API's current name for llm.auth; older messages stored that one.
  'llm.auth_failed':
    "⚠️ **The model connection isn't authorised**\n\nAn administrator needs to check the model configuration.",
  'llm.unsupported_tools':
    "⚠️ **This model can't use tools**\n\nAn administrator needs to choose a model that supports tools for this step.",
  'embeddings.model_not_found':
    '⚠️ **The model or deployment could not be found**\n\nAn administrator needs to check the model configuration.',
  // The app API's names for losing the AI API before or part-way through a reply.
  'ai_api.unavailable':
    '⚠️ **The connection to the model was interrupted**\n\nThis is usually temporary. Please try again.',
  'ai_api.stream_broken':
    '⚠️ **The connection to the model was interrupted**\n\nThis is usually temporary. Please try again.',
  // Managed secrets. A secret's failure arrives as a 404 or 400, which the
  // status table below would read as a missing model or a generic error.
  'secret.user_value_not_set':
    "⚠️ **Your own key for this isn't set**\n\nThis step uses a credential each person sets for themselves, and none is set for you yet. Ask an administrator to add it.",
  'secret.run_has_no_user':
    "⚠️ **This step needs a signed-in user**\n\nIt uses a person's own credential, so it can't run when no one started the run.",
  'secret.user_mismatch':
    "⚠️ **A credential couldn't be loaded**\n\nAn administrator needs to check this flow's secrets.",
  'secret.run_required':
    "⚠️ **A credential couldn't be loaded**\n\nAn administrator needs to check this flow's secrets.",
  'secret.not_found':
    "⚠️ **A secret this flow uses doesn't exist**\n\nAn administrator needs to add it, or point the flow at another one.",
  // The API's name for secret.not_found before it was renamed; older messages stored it.
  MS404:
    "⚠️ **A secret this flow uses doesn't exist**\n\nAn administrator needs to add it, or point the flow at another one.",
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
  | { code: number; errorCode?: string | null; message?: string | null };

export const getMessageErrorText = (error: MessageErrorLike): string => {
  if (typeof error === 'number') {
    return STATUS_CODE_TEXT[error] ?? GENERIC_ERROR_TEXT;
  }
  if (error.errorCode && ERROR_CODE_TEXT[error.errorCode]) {
    return ERROR_CODE_TEXT[error.errorCode];
  }
  // The status table's wording is about the model, so it speaks only for a
  // failure with no code or a model one.
  if (error.errorCode && !error.errorCode.startsWith('llm.')) {
    return GENERIC_ERROR_TEXT;
  }
  return STATUS_CODE_TEXT[error.code] ?? GENERIC_ERROR_TEXT;
};

/**
 * Provider error bodies (OpenAI/Azure-style) arrive embedded as a JSON blob
 * inside a prefixed string, e.g.
 * `litellm.BadRequestError: AzureException BadRequestError - {"error": {"message": "...", "param": "...", "code": "..."}}`.
 * Pulls the JSON substring out and returns its `error.message` (or top-level
 * `message` for providers that don't nest under `error`), plus `param` when
 * present since it usually names the exact misconfigured field.
 */
function extractProviderErrorDetail(
  raw: string
): { message: string; param?: string } | null {
  const start = raw.indexOf('{');
  if (start === -1) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start));
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  const inner =
    typeof record.error === 'object' && record.error !== null
      ? (record.error as Record<string, unknown>)
      : record;
  if (typeof inner.message !== 'string') return null;
  return {
    message: inner.message,
    param: typeof inner.param === 'string' ? inner.param : undefined,
  };
}

/**
 * The provider detail behind an error, shown in an optional "Show details"
 * disclosure under the friendly bubble from {@link getMessageErrorText}.
 * Returns null when there's nothing to add (a bare HTTP code, or no message
 * on the error at all).
 */
export const getMessageErrorDetail = (
  error: MessageErrorLike
): string | null => {
  if (typeof error === 'number' || !error.message) {
    return null;
  }
  const detail = extractProviderErrorDetail(error.message);
  if (!detail) {
    return error.message;
  }
  return detail.param
    ? `${detail.message} (param: ${detail.param})`
    : detail.message;
};
