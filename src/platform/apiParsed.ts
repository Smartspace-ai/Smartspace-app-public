// src/platform/apiParsed.ts
import type { AxiosRequestConfig } from 'axios';
import { ZodSchema } from 'zod';

import { api } from './api'; // your throwing client (requestOrThrow)
import { requestOrThrow } from './request'; // for non-GET convenience
import { parseOrThrow } from './validation';

// GET + parse (JSON endpoints)
export async function getParsed<T>(
  schema: ZodSchema<T>,
  url: string,
  cfg?: AxiosRequestConfig
): Promise<T> {
  const raw = await api.get<unknown>(url, cfg);           // throws AppError on HTTP errors
  return parseOrThrow(schema, raw, `GET ${url}`);         // throws AppError.ValidationError on Zod errors
}

// Any method + parse
export async function requestParsed<T>(
  schema: ZodSchema<T>,
  cfg: AxiosRequestConfig
): Promise<T> {
  const raw = await requestOrThrow<unknown>(cfg);         // HTTP error → AppError
  const ctx = `${(cfg.method ?? 'GET').toUpperCase()} ${cfg.url ?? ''}`;
  return parseOrThrow(schema, raw, ctx);                  // Zod error → AppError.ValidationError
}

// Optional sugar (nice DX in services)
export const apiParsed = {
  get:   <T>(schema: ZodSchema<T>, url: string, cfg?: AxiosRequestConfig) =>
          getParsed(schema, url, cfg),
  post:  <T>(schema: ZodSchema<T>, url: string, data?: unknown, cfg?: AxiosRequestConfig) =>
          requestParsed(schema, { method: 'POST', url, data, ...(cfg ?? {}) }),
  put:   <T>(schema: ZodSchema<T>, url: string, data?: unknown, cfg?: AxiosRequestConfig) =>
          requestParsed(schema, { method: 'PUT', url, data, ...(cfg ?? {}) }),
  patch: <T>(schema: ZodSchema<T>, url: string, data?: unknown, cfg?: AxiosRequestConfig) =>
          requestParsed(schema, { method: 'PATCH', url, data, ...(cfg ?? {}) }),
  del:   <T>(schema: ZodSchema<T>, url: string, cfg?: AxiosRequestConfig) =>
          requestParsed(schema, { method: 'DELETE', url, ...(cfg ?? {}) }),
};
