import { describe, expect, it } from 'vitest';

import { isTransient, toAppError } from '@/platform/envelopes';

describe('toAppError', () => {
  it('maps known status codes', () => {
    expect(toAppError(401)).toEqual({ type: 'Unauthorized' });
    expect(toAppError(403)).toEqual({ type: 'Forbidden' });
    expect(toAppError(404)).toEqual({ type: 'NotFound' });
    expect(toAppError(409, { message: 'x' })).toEqual({ type: 'Conflict', message: 'x' });
    expect(toAppError(422, { issues: ['e'] })).toEqual({ type: 'ValidationError', issues: ['e'] });
    expect(toAppError(429, { retryAfter: 5 })).toEqual({ type: 'RateLimited', retryAfterSec: 5 });
  });

  it('maps unknown codes to UnknownError', () => {
    expect(toAppError(500, { message: 'boom' })).toEqual({ type: 'UnknownError', status: 500, message: 'boom' });
    expect(toAppError(undefined, {})).toEqual({ type: 'UnknownError', status: undefined, message: undefined });
  });
});

describe('isTransient', () => {
  it('true for NetworkError', () => {
    expect(isTransient({ type: 'NetworkError', message: 'x' })).toBe(true);
  });
  it('true for UnknownError with 5xx', () => {
    expect(isTransient({ type: 'UnknownError', status: 500 })).toBe(true);
  });
  it('false for UnknownError with 4xx', () => {
    expect(isTransient({ type: 'UnknownError', status: 404 })).toBe(false);
  });
  it('false for other shapes', () => {
    expect(isTransient(null)).toBe(false);
    expect(isTransient({})).toBe(false);
  });
});


