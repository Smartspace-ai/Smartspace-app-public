import { describe, expect, it, vi } from 'vitest';

import { api } from '@/platform/api';

vi.mock('@smartspace/api-client', () => ({
  AXIOS_INSTANCE: {},
}));

import { fetchSpeechConfig, fetchSpeechToken } from '@/domains/speech/service';

describe('speech service', () => {
  it('fetchSpeechConfig reads GET /speech/config and validates the shape', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      enabled: true,
      region: 'australiaeast',
      defaultLocale: 'en-NZ',
    } as unknown as never);

    await expect(fetchSpeechConfig()).resolves.toEqual({
      enabled: true,
      region: 'australiaeast',
      defaultLocale: 'en-NZ',
    });
    expect(spy.mock.calls[0]?.[0]).toBe('/speech/config');
    spy.mockRestore();
  });

  it('fetchSpeechConfig accepts the not-configured shape (null region)', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      enabled: false,
      region: null,
      defaultLocale: 'en-NZ',
    } as unknown as never);

    await expect(fetchSpeechConfig()).resolves.toMatchObject({
      enabled: false,
      region: null,
    });
    spy.mockRestore();
  });

  it('fetchSpeechToken reads GET /speech/token', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      token: 'abc',
      expiresOn: '2026-08-16T10:00:00+00:00',
    } as unknown as never);

    await expect(fetchSpeechToken()).resolves.toEqual({
      token: 'abc',
      expiresOn: '2026-08-16T10:00:00+00:00',
    });
    spy.mockRestore();
  });

  it('fetchSpeechToken rejects a malformed body as a validation error', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      token: '',
    } as unknown as never);

    await expect(fetchSpeechToken()).rejects.toMatchObject({
      type: 'ValidationError',
    });
    spy.mockRestore();
  });
});
