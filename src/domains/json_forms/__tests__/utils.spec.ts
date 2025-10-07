import type { JsonSchema } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';

import { getDefaultValues } from '@/domains/json_forms/utils';

describe('getDefaultValues', () => {
  it('returns null for non-object schema', () => {
    expect(getDefaultValues({ type: 'string' } as JsonSchema)).toBeNull();
  });

  it('builds defaults for nested object and array', () => {
    const schema = {
      type: 'object',
      properties: {
        a: { type: 'string', default: 'x' },
        b: { type: 'number' },
        c: {
          type: 'object',
          properties: {
            d: { type: 'boolean', default: true },
          },
        },
        e: { type: 'array', items: { type: 'string' } },
      },
    } as unknown as JsonSchema;

    expect(getDefaultValues(schema)).toEqual({
      a: 'x',
      b: null,
      c: { d: true },
      e: [],
    });
  });

  it('supports type union including object', () => {
    const schema = {
      type: ['object', 'null'],
      properties: { a: { type: 'string' } },
    } as unknown as JsonSchema;
    expect(getDefaultValues(schema)).toEqual({ a: null });
  });
});


