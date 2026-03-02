export class AuthRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export function toAuthRequiredError(e: unknown): AuthRequiredError {
  const msg =
    e instanceof Error ? e.message : (typeof e === 'string' ? e : 'Authentication required');
  return new AuthRequiredError(msg);
}


