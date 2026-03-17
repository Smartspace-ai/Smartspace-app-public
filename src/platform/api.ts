// src/platform/api.ts
import type { AxiosRequestConfig } from 'axios';

import { requestOrThrow } from './request';

/**
 * Typed API wrapper:
 * - api.get/post/put/patch/delete
 * - returns response.data
 * - throws AppError on failure
 */
export const api = {
  get:   <T>(url: string, cfg?: AxiosRequestConfig) =>
    requestOrThrow<T>({ method: 'GET',    url, ...(cfg ?? {}) }),

  post:  <TResp, TBody = unknown>(url: string, data?: TBody, cfg?: AxiosRequestConfig) =>
    requestOrThrow<TResp>({ method: 'POST',   url, data, ...(cfg ?? {}) }),

  put:   <TResp, TBody = unknown>(url: string, data?: TBody, cfg?: AxiosRequestConfig) =>
    requestOrThrow<TResp>({ method: 'PUT',    url, data, ...(cfg ?? {}) }),

  patch: <TResp, TBody = unknown>(url: string, data?: TBody, cfg?: AxiosRequestConfig) =>
    requestOrThrow<TResp>({ method: 'PATCH',  url, data, ...(cfg ?? {}) }),

  delete:<T>(url: string, cfg?: AxiosRequestConfig) =>
    requestOrThrow<T>({ method: 'DELETE', url, ...(cfg ?? {}) }),
};

export default api;
