import { describe, expect, it, vi } from 'vitest';

import { createSpeechTokenCredential } from '@smartspace/chat-ui';

const inMinutes = (m: number) =>
  new Date(Date.now() + m * 60_000).toISOString();

describe('createSpeechTokenCredential', () => {
  it('uses the seed token without calling the API', async () => {
    const fetchToken = vi.fn();
    const credential = createSpeechTokenCredential(fetchToken, {
      token: 'seeded',
      expiresOn: inMinutes(60),
    });

    await expect(credential.getToken('scope')).resolves.toMatchObject({
      token: 'seeded',
    });
    expect(fetchToken).not.toHaveBeenCalled();
  });

  it('fetches once and serves the cached token to later calls', async () => {
    const fetchToken = vi
      .fn()
      .mockResolvedValue({ token: 'fetched', expiresOn: inMinutes(60) });
    const credential = createSpeechTokenCredential(fetchToken);

    await credential.getToken('scope');
    await credential.getToken('scope');

    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('shares one in-flight request between concurrent callers', async () => {
    const fetchToken = vi
      .fn()
      .mockResolvedValue({ token: 'fetched', expiresOn: inMinutes(60) });
    const credential = createSpeechTokenCredential(fetchToken);

    await Promise.all([
      credential.getToken('scope'),
      credential.getToken('scope'),
      credential.getToken('scope'),
    ]);

    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('refetches when the cached token is inside the refresh skew', async () => {
    const fetchToken = vi
      .fn()
      .mockResolvedValue({ token: 'fresh', expiresOn: inMinutes(60) });
    // Seeded token expires in 1 minute, i.e. inside the 2-minute skew.
    const credential = createSpeechTokenCredential(fetchToken, {
      token: 'nearly-expired',
      expiresOn: inMinutes(1),
    });

    await expect(credential.getToken('scope')).resolves.toMatchObject({
      token: 'fresh',
    });
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('does not re-fetch on every call when the expiry is unparseable', async () => {
    const fetchToken = vi
      .fn()
      .mockResolvedValue({ token: 'fetched', expiresOn: 'not-a-date' });
    const credential = createSpeechTokenCredential(fetchToken);

    await credential.getToken('scope');
    await credential.getToken('scope');

    // A NaN expiry previously failed every cache check, re-hitting the API on
    // each SDK reconnect.
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('propagates a failed fetch and can retry afterwards', async () => {
    const fetchToken = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ token: 'second', expiresOn: inMinutes(60) });
    const credential = createSpeechTokenCredential(fetchToken);

    await expect(credential.getToken('scope')).rejects.toThrow('boom');
    await expect(credential.getToken('scope')).resolves.toMatchObject({
      token: 'second',
    });
  });
});
