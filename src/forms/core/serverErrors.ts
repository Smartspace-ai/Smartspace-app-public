/**
 * Map API/server errors to React Hook Form.
 * Policy: 400/422 → field errors; 401/403 → auth; 409 → root message; 5xx → global + log.
 */

import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import type { AppError } from '@/platform/envelopes';

const axiosLike = (
  e: unknown
): e is { response?: { status?: number; data?: unknown } } =>
  typeof e === 'object' && e !== null && ('response' in e || 'message' in e);

/** Normalize thrown error (e.g. axios) to AppError-like shape for form handling. */
export function normalizeToAppError(e: unknown): AppError {
  if (
    e &&
    typeof e === 'object' &&
    'type' in e &&
    typeof (e as AppError).type === 'string'
  ) {
    return e as AppError;
  }
  if (axiosLike(e)) {
    const status = e.response?.status;
    const body = e.response?.data;
    const b =
      body && typeof body === 'object'
        ? (body as Record<string, unknown>)
        : undefined;
    switch (status) {
      case 400:
      case 422:
        return { type: 'ValidationError', issues: b?.issues ?? body };
      case 401:
        return { type: 'Unauthorized' };
      case 403:
        return { type: 'Forbidden' };
      case 404:
        return { type: 'NotFound' };
      case 409:
        return {
          type: 'Conflict',
          message: typeof b?.message === 'string' ? b.message : undefined,
        };
      case 429:
        return {
          type: 'RateLimited',
          retryAfterSec:
            typeof b?.retryAfter === 'number' ? b.retryAfter : undefined,
        };
      default:
        return {
          type: 'UnknownError',
          status,
          message: typeof b?.message === 'string' ? b.message : undefined,
        };
    }
  }
  return {
    type: 'UnknownError',
    message: e instanceof Error ? e.message : String(e),
  };
}

/** Zod-style issue: path array and message. */
type IssueLike = { path?: (string | number)[]; message?: string };

function isIssueLike(x: unknown): x is IssueLike {
  return typeof x === 'object' && x !== null;
}

function getIssues(error: AppError): IssueLike[] {
  if (error.type !== 'ValidationError' || error.issues == null) return [];
  const raw = error.issues;
  if (Array.isArray(raw)) return raw.filter(isIssueLike);
  if (isIssueLike(raw)) return [raw];
  return [];
}

export type MapServerErrorResult =
  | { handled: true; auth?: boolean; conflict?: boolean }
  | { handled: false };

/**
 * Apply server error to form: set field errors for validation, root for conflict/5xx.
 * 401/403: returns { handled: true, auth: true } so caller can redirect or show auth UI.
 * 409: setError('root', { message }) and return { handled: true, conflict: true }.
 * 5xx: setError('root', { message }) and return { handled: true }. Caller should log.
 */
export function mapServerErrorToForm<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  options?: {
    onAuth?: () => void;
    onConflict?: (message?: string) => void;
    logServerError?: (err: AppError) => void;
  }
): MapServerErrorResult {
  const err = normalizeToAppError(error);

  switch (err.type) {
    case 'Unauthorized':
    case 'Forbidden':
      options?.onAuth?.();
      return { handled: true, auth: true };
    case 'Conflict': {
      const conflictMsg =
        err.message ?? 'A conflict occurred. Please refresh and try again.';
      setError('root' as Path<T>, { type: 'manual', message: conflictMsg });
      options?.onConflict?.(err.message);
      return { handled: true, conflict: true };
    }
    case 'ValidationError': {
      const issues = getIssues(err);
      for (const issue of issues) {
        const path = (issue.path ?? []).filter(
          (p): p is string => typeof p === 'string'
        );
        const key = path.join('.') as Path<T>;
        if (key && issue.message) {
          setError(key, { type: 'manual', message: issue.message });
        }
      }
      if (issues.length === 0) {
        setError('root' as Path<T>, {
          type: 'manual',
          message: 'Validation failed. Please check your input.',
        });
      }
      return { handled: true };
    }
    case 'NotFound': {
      setError('root' as Path<T>, {
        type: 'manual',
        message: 'The resource was not found.',
      });
      return { handled: true };
    }
    case 'NetworkError':
    case 'UnknownError':
    case 'RateLimited': {
      const msg =
        err.type === 'NetworkError'
          ? err.message
          : err.type === 'RateLimited'
          ? 'Too many requests. Please try again later.'
          : err.message ?? 'Something went wrong. Please try again.';
      setError('root' as Path<T>, { type: 'manual', message: msg });
      if (
        err.type === 'UnknownError' &&
        (err.status == null || err.status >= 500)
      ) {
        options?.logServerError?.(err);
      }
      return { handled: true };
    }
    default:
      return { handled: false };
  }
}
