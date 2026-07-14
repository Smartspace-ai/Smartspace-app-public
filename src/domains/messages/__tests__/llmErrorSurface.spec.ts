import { describe, expect, it } from 'vitest';

import {
  getMessageErrorText,
  getRetryStatusText,
  mapMessageErrorDtoToModel,
  parseRetryStatus,
} from '@smartspace/chat-ui';

import { preserveErrorCodes, rawErrorCode } from '../service';

// Pins the error/status contract with the backend LLM reliability work:
// errors carry a stable machine-readable category (errorCode, e.g.
// "llm.rate_limit") alongside the numeric HTTP code, and the retry loop
// emits a structured status payload during backoff waits.

describe('getMessageErrorText', () => {
  it('prefers the machine-readable error code over the HTTP code', () => {
    const text = getMessageErrorText({
      code: 400,
      errorCode: 'llm.context_window',
    });
    expect(text).toContain('too long for the model');
  });

  it.each([
    ['llm.rate_limit', 'too many requests'],
    ['llm.timeout', 'took too long'],
    ['llm.transient_connection', 'interrupted'],
    ['llm.upstream_error', 'provider had a problem'],
    ['llm.auth', "isn't authorised"],
    ['llm.not_found', 'could not be found'],
    ['llm.invalid_request', 'rejected'],
    ['llm.content_policy', 'content filter'],
    ['llm.schema_validation', 'invalid response'],
    ['llm.unsupported_modality', "can't read images"],
  ])('has a specific message for %s', (errorCode, fragment) => {
    expect(getMessageErrorText({ code: 500, errorCode })).toContain(fragment);
  });

  it('falls back to the HTTP code when the error code is unknown', () => {
    const text = getMessageErrorText({
      code: 429,
      errorCode: 'llm.something_new',
    });
    expect(text).toContain('too many requests');
  });

  it('maps bare HTTP codes for older messages (back-compat)', () => {
    expect(getMessageErrorText(429)).toContain('too many requests');
    expect(getMessageErrorText({ code: 503 })).toContain('interrupted');
    expect(getMessageErrorText({ code: 418 })).toContain('unexpected error');
  });
});

describe('parseRetryStatus', () => {
  it('parses the backend retry payload (snake_case, as emitted by ai-api)', () => {
    const status = parseRetryStatus({
      type: 'retry',
      attempt: 1,
      max_attempts: 3,
      delay_seconds: 7.5,
      error_code: 'llm.rate_limit',
    });
    expect(status).toEqual({
      type: 'retry',
      attempt: 1,
      maxAttempts: 3,
      delaySeconds: 7.5,
      errorCode: 'llm.rate_limit',
    });
  });

  it('parses camelCase and JSON-string payloads', () => {
    const camel = parseRetryStatus({
      type: 'retry',
      attempt: 2,
      maxAttempts: 3,
    });
    expect(camel?.attempt).toBe(2);

    const fromString = parseRetryStatus(
      JSON.stringify({ type: 'retry', attempt: 1, max_attempts: 3 })
    );
    expect(fromString?.maxAttempts).toBe(3);
  });

  it('returns null for plain-string statuses and unknown shapes', () => {
    expect(parseRetryStatus('Searching documents…')).toBeNull();
    expect(parseRetryStatus(null)).toBeNull();
    expect(parseRetryStatus({ type: 'retry' })).toBeNull(); // missing counts
    expect(parseRetryStatus({ type: 'other', attempt: 1 })).toBeNull();
  });
});

describe('getRetryStatusText', () => {
  it('describes the retry in progress with reason and wait', () => {
    const text = getRetryStatusText({
      type: 'retry',
      attempt: 1,
      maxAttempts: 3,
      delaySeconds: 8,
      errorCode: 'llm.rate_limit',
    });
    expect(text).toContain('the model is busy');
    expect(text).toContain('attempt 2 of 3');
    expect(text).toContain('~8s');
  });

  it('stays readable without optional fields', () => {
    const text = getRetryStatusText({
      type: 'retry',
      attempt: 2,
      maxAttempts: 3,
    });
    expect(text).toContain('attempt 3 of 3');
    expect(text).not.toContain('~');
  });
});

describe('mapMessageErrorDtoToModel', () => {
  it('coalesces snake_case error_code into errorCode', () => {
    const model = mapMessageErrorDtoToModel({
      code: 503,
      error_code: 'llm.transient_connection',
    } as never);
    expect(model.errorCode).toBe('llm.transient_connection');
    expect('error_code' in model).toBe(false);
  });

  it('keeps errors without any code working (back-compat)', () => {
    const model = mapMessageErrorDtoToModel({ code: 500 } as never);
    expect(model.errorCode).toBeUndefined();
    expect(model.code).toBe(500);
  });
});

describe('preserveErrorCodes', () => {
  // The generated api-client zod schema strips unknown fields — these
  // helpers re-attach the machine-readable category from the raw payload.
  it('copies errorCode from raw errors onto the parsed DTO by index', () => {
    const raw = {
      errors: [
        { code: 503, error_code: 'llm.transient_connection' },
        { code: 429, errorCode: 'llm.rate_limit' },
      ],
    };
    const parsed = { errors: [{ code: 503 }, { code: 429 }] };
    preserveErrorCodes(raw, parsed);
    expect(parsed.errors).toEqual([
      { code: 503, errorCode: 'llm.transient_connection' },
      { code: 429, errorCode: 'llm.rate_limit' },
    ]);
  });

  it('is a no-op without raw errors or parsed errors', () => {
    const parsed = { errors: [{ code: 500 }] };
    preserveErrorCodes({}, parsed);
    expect(parsed.errors).toEqual([{ code: 500 }]);
    expect(preserveErrorCodes(null, { errors: null }).errors).toBeNull();
  });

  it('rawErrorCode accepts both spellings and rejects non-strings', () => {
    expect(rawErrorCode({ error_code: 'llm.timeout' })).toBe('llm.timeout');
    expect(rawErrorCode({ errorCode: 'llm.auth' })).toBe('llm.auth');
    expect(rawErrorCode({ errorCode: 42 })).toBeUndefined();
    expect(rawErrorCode('nope')).toBeUndefined();
  });
});
