// src/platform/request.ts
import axios, { type AxiosRequestConfig } from 'axios';

import { api } from './api/apiClient';
import { Result, toAppError } from './envelopes';

function isAxiosLikeError(e: unknown): e is { response?: { status?: unknown; data?: unknown }; message?: unknown } {
  if (!e || typeof e !== 'object') return false;
  return 'response' in e || 'message' in e;
}

export async function request<T = unknown>(config: AxiosRequestConfig): Promise<Result<T>> {
  try {
    const res = await api.request<T>(config);
    return { ok: true, data: res.data as T };
  } catch (err: unknown) {
    const status =
      axios.isAxiosError(err)
        ? err.response?.status
        : (isAxiosLikeError(err) && typeof err.response?.status === 'number' ? err.response.status : undefined);
    const body =
      axios.isAxiosError(err)
        ? err.response?.data
        : (isAxiosLikeError(err) ? err.response?.data : undefined);
    if (status === undefined) {
      const msg = axios.isAxiosError(err)
        ? String(err.message ?? 'Network error')
        : (isAxiosLikeError(err) && typeof err.message === 'string'
            ? err.message
            : (err instanceof Error ? err.message : String(err)));
      return { ok: false, error: { type: 'NetworkError', message: msg } };
    }
    return { ok: false, error: toAppError(status, body) };
  }
}

export function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw r.error;
  return r.data;
}

export async function requestOrThrow<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return unwrap(await request<T>(config));
}
