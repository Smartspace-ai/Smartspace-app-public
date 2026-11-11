// src/platform/envelopes.ts
/**
 * The fields the API puts on every problem-details error body. Absent when the
 * response was not one of ours (a gateway's HTML 502, for one).
 */
export type Problem = {
  /**
   * Machine-readable error code, e.g. `thread.already_running`. 5xx responses
   * scrub the message, so this is the only detail that survives them.
   */
  code?: string;
  /** Whether the same request may succeed if retried unchanged. */
  retryable?: boolean;
  /** Trace id of the failed request, for a support reference. */
  traceId?: string;
};

export type NetworkError = { type: 'NetworkError'; message: string };
export type Unauthorized = { type: 'Unauthorized' } & Problem;
export type Forbidden = { type: 'Forbidden' } & Problem;
export type NotFound = { type: 'NotFound' } & Problem;
export type Conflict = { type: 'Conflict'; message?: string } & Problem;
export type RateLimited = {
  type: 'RateLimited';
  retryAfterSec?: number;
} & Problem;
export type ValidationError = {
  type: 'ValidationError';
  issues?: unknown;
} & Problem;
export type UnknownError = {
  type: 'UnknownError';
  status?: number;
  message?: string;
} & Problem;

export type AppError =
  | NetworkError
  | Unauthorized
  | Forbidden
  | NotFound
  | Conflict
  | RateLimited
  | ValidationError
  | UnknownError;

export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: AppError };
export type Result<T> = Ok<T> | Err;

function asRecord(x: unknown): Record<string, unknown> | null {
  return x && typeof x === 'object' ? (x as Record<string, unknown>) : null;
}

function problemOf(b: Record<string, unknown> | null): Problem {
  const problem: Problem = {};
  if (typeof b?.code === 'string') problem.code = b.code;
  if (typeof b?.retryable === 'boolean') problem.retryable = b.retryable;
  if (typeof b?.traceId === 'string') problem.traceId = b.traceId;
  return problem;
}

export function toAppError(status?: number, body?: unknown): AppError {
  const b = asRecord(body);
  const problem = problemOf(b);
  // The API's 5xx detail is scrubbed text meant for developers ("check server
  // logs"), so only a 4xx detail is a message a user can act on.
  const detail =
    typeof b?.detail === 'string' && status !== undefined && status < 500
      ? b.detail
      : undefined;
  switch (status) {
    case 401:
      return { type: 'Unauthorized', ...problem };
    case 403:
      return { type: 'Forbidden', ...problem };
    case 404:
      return { type: 'NotFound', ...problem };
    case 409:
      return { type: 'Conflict', message: detail, ...problem };
    case 422:
      return {
        type: 'ValidationError',
        issues: b && 'issues' in b ? b.issues : body,
        ...problem,
      };
    case 429:
      return {
        type: 'RateLimited',
        retryAfterSec: Number(b?.retryAfter) || undefined,
        ...problem,
      };
    default:
      return { type: 'UnknownError', status, message: detail, ...problem };
  }
}

export const isTransient = (e: unknown): boolean => {
  const err = asRecord(e);
  if (!err) return false;
  if (err.type === 'NetworkError') return true;
  // The API says whether a retry can help; a 5xx without its body (a gateway's
  // 502 or 504) falls back to the status.
  if (typeof err.retryable === 'boolean') return err.retryable;
  if (err.type === 'UnknownError' && typeof err.status === 'number')
    return err.status >= 500;
  return false;
};

/**
 * For reads only. As isTransient, and also follows the API's `retryable` on a
 * raw AxiosError, which is what every generated client call throws. A write
 * must not use this: resending a POST the API calls retryable can apply it
 * twice.
 */
export const isTransientRead = (e: unknown): boolean => {
  if (isTransient(e)) return true;
  const body = asRecord(asRecord(asRecord(e)?.response)?.data);
  return problemOf(body).retryable === true;
};

/** True when error is AppError NotFound or HTTP 404 (e.g. axios error). */
export function isNotFoundError(e: unknown): boolean {
  const r = e && typeof e === 'object' ? (e as Record<string, unknown>) : null;
  if (r?.type === 'NotFound') return true;
  if (!r || !('response' in r)) return false;
  const res = (r as { response?: { status?: number } }).response;
  return res?.status === 404;
}
