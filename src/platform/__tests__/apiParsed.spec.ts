import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import * as apiMod from '@/platform/api';
import { apiParsed, getParsed, requestParsed } from '@/platform/apiParsed';
import * as requestMod from '@/platform/request';

describe('apiParsed/getParsed/requestParsed', () => {
  it('getParsed parses valid response and throws on zod error', async () => {
    const schema = z.object({ a: z.number() });
    const spy = vi.spyOn(apiMod.api, 'get').mockResolvedValueOnce({ a: 1 } as unknown as { a: number });
    await expect(getParsed(schema, '/x')).resolves.toEqual({ a: 1 });
    spy.mockResolvedValueOnce({ a: 'x' } as unknown as { a: number });
    await expect(getParsed(schema, '/x')).rejects.toMatchObject({ type: 'ValidationError' });
    spy.mockRestore();
  });

  it('requestParsed uses requestOrThrow and parses', async () => {
    const schema = z.object({ b: z.string() });
    const spy = vi.spyOn(requestMod, 'requestOrThrow').mockResolvedValueOnce({ b: 'ok' } as unknown as { b: string });
    await expect(requestParsed(schema, { method: 'POST', url: '/y' })).resolves.toEqual({ b: 'ok' });
    spy.mockResolvedValueOnce({ b: 1 } as unknown as { b: string });
    await expect(requestParsed(schema, { method: 'PUT', url: '/y' })).rejects.toMatchObject({ type: 'ValidationError' });
    spy.mockRestore();
  });

  it('apiParsed sugar methods call underlying functions', async () => {
    const schema = z.object({ c: z.literal('c') });
    const gp = vi.spyOn(apiMod.api, 'get').mockResolvedValueOnce({ c: 'c' } as unknown as { c: 'c' });
    await expect(apiParsed.get(schema, '/c')).resolves.toEqual({ c: 'c' });
    gp.mockRestore();
  });
});


