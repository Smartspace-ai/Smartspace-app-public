import { describe, expect, it } from 'vitest';

import { isTransient, toAppError } from '@/platform/envelopes';

describe('toAppError', () => {
  it('maps known status codes', () => {
    expect(toAppError(401)).toEqual({ type: 'Unauthorized' });
    expect(toAppError(403)).toEqual({ type: 'Forbidden' });
    expect(toAppError(404)).toEqual({ type: 'NotFound' });
    expect(toAppError(409, { detail: 'x' })).toEqual({
      type: 'Conflict',
      message: 'x',
    });
    expect(toAppError(422, { issues: ['e'] })).toEqual({
      type: 'ValidationError',
      issues: ['e'],
    });
    expect(toAppError(429, { retryAfter: 5 })).toEqual({
      type: 'RateLimited',
      retryAfterSec: 5,
    });
  });

  it('maps unknown codes to UnknownError', () => {
    expect(toAppError(400, { detail: 'Name is required.' })).toEqual({
      type: 'UnknownError',
      status: 400,
      message: 'Name is required.',
    });
    expect(toAppError(undefined, {})).toEqual({
      type: 'UnknownError',
      status: undefined,
      message: undefined,
    });
  });

  it('keeps the scrubbed 5xx detail out of the message', () => {
    const body = {
      detail: 'An internal error occurred. Check server logs for details.',
    };
    expect(toAppError(500, body)).toEqual({
      type: 'UnknownError',
      status: 500,
      message: undefined,
    });
  });

  it('carries the problem fields on every HTTP error', () => {
    const problem = {
      code: 'thread.not_found',
      retryable: false,
      traceId: '0af7651916cd43dd8448eb211c80319c',
    };
    expect(toAppError(404, problem)).toEqual({ type: 'NotFound', ...problem });
    expect(toAppError(403, { ...problem, code: 'forbidden' })).toEqual({
      type: 'Forbidden',
      ...problem,
      code: 'forbidden',
    });
    expect(
      toAppError(503, { ...problem, code: 'SP503', retryable: true })
    ).toEqual({
      type: 'UnknownError',
      status: 503,
      message: undefined,
      ...problem,
      code: 'SP503',
      retryable: true,
    });
  });

  it('drops problem fields of the wrong type', () => {
    expect(
      toAppError(404, { code: 7, retryable: 'true', traceId: null })
    ).toEqual({ type: 'NotFound' });
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
  it('follows the API when it says whether a retry can help', () => {
    expect(
      isTransient(toAppError(503, { code: 'SP503', retryable: true }))
    ).toBe(true);
    expect(
      isTransient(toAppError(500, { code: 'internal', retryable: false }))
    ).toBe(false);
  });
  it('falls back to the status for a 5xx without a problem body', () => {
    expect(isTransient(toAppError(502, '<html>Bad gateway</html>'))).toBe(true);
  });
  it('false for other shapes', () => {
    expect(isTransient(null)).toBe(false);
    expect(isTransient({})).toBe(false);
  });
});
