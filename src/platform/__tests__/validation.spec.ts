import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { parseOrThrow } from '@/platform/validation';

describe('parseOrThrow', () => {
  it('parses valid data', () => {
    const schema = z.object({ a: z.number() });
    expect(parseOrThrow(schema, { a: 1 })).toEqual({ a: 1 });
  });

  it('throws AppError.ValidationError on zod error', () => {
    const schema = z.object({ a: z.string() });
    try {
      parseOrThrow(schema, { a: 1 }, 'CTX');
      throw new Error('should have thrown');
    } catch (e: unknown) {
      const err = e as { type?: string; issues?: unknown };
      expect(err?.type).toBe('ValidationError');
      expect(err?.issues).toBeTruthy();
    }
  });
});


