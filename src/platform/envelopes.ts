// src/platform/envelopes.ts
export type NetworkError    = { type: 'NetworkError'; message: string };
export type Unauthorized    = { type: 'Unauthorized' };
export type Forbidden       = { type: 'Forbidden' };
export type NotFound        = { type: 'NotFound' };
export type Conflict        = { type: 'Conflict'; message?: string };
export type RateLimited     = { type: 'RateLimited'; retryAfterSec?: number };
export type ValidationError = { type: 'ValidationError'; issues?: unknown };
export type UnknownError    = { type: 'UnknownError'; status?: number; message?: string };

export type AppError =
  | NetworkError | Unauthorized | Forbidden | NotFound
  | Conflict | RateLimited | ValidationError | UnknownError;

export type Ok<T>     = { ok: true; data: T };
export type Err       = { ok: false; error: AppError };
export type Result<T> = Ok<T> | Err;

export function toAppError(status?: number, body?: any): AppError {
  switch (status) {
    case 401: return { type: 'Unauthorized' };
    case 403: return { type: 'Forbidden' };
    case 404: return { type: 'NotFound' };
    case 409: return { type: 'Conflict', message: body?.message };
    case 422: return { type: 'ValidationError', issues: body?.issues ?? body };
    case 429: return { type: 'RateLimited', retryAfterSec: Number(body?.retryAfter) || undefined };
    default:  return { type: 'UnknownError', status, message: body?.message };
  }
}

export const isTransient = (e: unknown): boolean => {
  const err = e as any;
  if (!err || typeof err !== 'object') return false;
  if (err.type === 'NetworkError') return true;
  if (err.type === 'UnknownError' && typeof err.status === 'number') return err.status >= 500;
  return false;
};
