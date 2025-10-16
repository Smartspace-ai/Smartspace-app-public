import { describe, expect, it, vi } from 'vitest';

import { request, requestOrThrow, unwrap } from '@/platform/request';
import * as transportMod from '@/platform/transport';

describe('request/unwrap', () => {
  it('returns ok result on success', async () => {
    const spy = vi.spyOn(transportMod.transport, 'request').mockResolvedValueOnce({ data: { a: 1 } } as unknown as { data: { a: number } });
    const res = await request<{ a: number }>({ method: 'GET', url: '/x' });
    expect(res.ok).toBe(true);
    // @ts-expect-error guarded by ok flag
    expect(res.data).toEqual({ a: 1 });
    spy.mockRestore();
  });

  it('maps network error', async () => {
    const err = new Error('net');
    const spy = vi.spyOn(transportMod.transport, 'request').mockRejectedValueOnce(err);
    const res = await request({ method: 'GET', url: '/x' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.type).toBe('NetworkError');
    spy.mockRestore();
  });

  it('maps http error to AppError', async () => {
    const spy = vi.spyOn(transportMod.transport, 'request').mockRejectedValueOnce({ response: { status: 404, data: {} } });
    const res = await request({ method: 'GET', url: '/x' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.type).toBe('NotFound');
    spy.mockRestore();
  });

  it('requestOrThrow throws on Err and returns data on Ok', async () => {
    const success = vi.spyOn(transportMod.transport, 'request').mockResolvedValueOnce({ data: { ok: true } } as unknown as { data: { ok: boolean } });
    await expect(requestOrThrow({ method: 'GET', url: '/ok' })).resolves.toEqual({ ok: true });
    success.mockRestore();

    const fail = vi.spyOn(transportMod.transport, 'request').mockRejectedValueOnce({ response: { status: 403 } });
    await expect(requestOrThrow({ method: 'GET', url: '/fail' })).rejects.toMatchObject({ type: 'Forbidden' });
    fail.mockRestore();
  });

  it('unwrap returns data or throws', () => {
    expect(unwrap({ ok: true, data: 1 })).toBe(1);
    expect(() => unwrap({ ok: false, error: { type: 'Unauthorized' } })).toThrow();
  });
});


