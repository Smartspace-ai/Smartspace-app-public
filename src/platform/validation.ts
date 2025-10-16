// src/platform/validation.ts
import { ZodError, ZodSchema } from 'zod';

import type { AppError } from './envelopes';

export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown, context?: string): T {
  try {
    return schema.parse(data);
  } catch (e) {
    if (e instanceof ZodError) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error(`[Zod parse error${context ? ` in ${context}` : ''}]`, e);
      }
      const err: AppError = { type: 'ValidationError', issues: e.issues };
      throw err;
    }
    throw e;
  }
}
