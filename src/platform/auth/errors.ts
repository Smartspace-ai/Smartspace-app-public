export class AuthRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

/**
 * A token request failed because the network did, not because the session
 * did: signing in again cannot help. `type` matches the app's NetworkError, so
 * the request fails as any offline request does (retried, shown inline).
 */
export class TransientAuthError extends Error {
  readonly type = 'NetworkError';
  constructor(message = 'Network failure getting a token') {
    super(message);
    this.name = 'TransientAuthError';
  }
}

// MSAL 3.30's codes for a token request that got no usable answer
// (msal-browser BrowserAuthErrorCodes, msal-common ClientAuthErrorCodes).
const MSAL_NETWORK_CODES = new Set([
  'no_network_connectivity',
  'post_request_failed',
  'get_request_failed',
  'failed_to_parse_response',
  'network_error',
]);

/** True when an MSAL error means the network failed, not the session. */
export function isMsalNetworkFailure(e: unknown): boolean {
  const code = (e as { errorCode?: unknown } | null)?.errorCode;
  return typeof code === 'string' && MSAL_NETWORK_CODES.has(code);
}

export function toAuthRequiredError(e: unknown): AuthRequiredError {
  const msg =
    e instanceof Error
      ? e.message
      : typeof e === 'string'
      ? e
      : 'Authentication required';
  return new AuthRequiredError(msg);
}
