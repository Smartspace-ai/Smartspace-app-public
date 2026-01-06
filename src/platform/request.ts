// src/platform/request.ts
import type { AxiosRequestConfig } from 'axios';

import { Result, toAppError } from './envelopes';
import { api } from './api/apiClient';

export async function request<T = unknown>(config: AxiosRequestConfig): Promise<Result<T>> {
  try {
    const res = await api.request<T>(config);
    return { ok: true, data: res.data as T };
  } catch (err: any) {
    const status = err?.response?.status as number | undefined;
    const body   = err?.response?.data;
    if (status === undefined) {
      return { ok: false, error: { type: 'NetworkError', message: String(err?.message ?? 'Network error') } };
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
