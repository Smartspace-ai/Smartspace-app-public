export class AuthRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

/**
 * True when a failure means the user is not signed in: the interceptor's
 * `AuthRequiredError`, an `AppError` of type `Unauthorized`, or a raw HTTP
 * 401 from the generated client.
 */
export function isAuthError(e: unknown): boolean {
  if (e instanceof AuthRequiredError) return true;
  if (!e || typeof e !== 'object') return false;
  if ((e as { type?: unknown }).type === 'Unauthorized') return true;
  const response = (e as { response?: { status?: unknown } }).response;
  return response?.status === 401;
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
