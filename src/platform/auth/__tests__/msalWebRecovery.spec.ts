import { describe, expect, it, vi } from 'vitest';

import { getMsalInstance } from '@/platform/auth/msalClient';
import {
  createMsalWebAdapter,
  refreshWebTokenSilently,
  signInWithPopup,
} from '@/platform/auth/providers/msalWeb';

// src/test/setup.ts mocks msalClient with a shared fake instance, which has
// no acquireTokenPopup; each test adds one.
const msal = getMsalInstance() as unknown as {
  acquireTokenSilent: ReturnType<typeof vi.fn>;
  acquireTokenPopup?: (...args: unknown[]) => Promise<unknown>;
};

describe('web session recovery against MSAL', () => {
  it('the silent refresh skips the cached token', async () => {
    // Breaks if forceRefresh is dropped: MSAL hands back the cached token the
    // server just rejected, and recovery does nothing.
    msal.acquireTokenSilent.mockClear();

    await refreshWebTokenSilently();

    expect(msal.acquireTokenSilent).toHaveBeenCalledWith(
      expect.objectContaining({ forceRefresh: true })
    );
  });

  it('the popup is opened before anything is awaited', () => {
    // Breaks if signInWithPopup awaits first (or goes through the adapter's
    // silent step): the browser blocks a popup opened after the click.
    msal.acquireTokenPopup = vi.fn(() => new Promise(() => undefined));

    void signInWithPopup();

    expect(msal.acquireTokenPopup).toHaveBeenCalledTimes(1);
  });

  it('token requests do not wait while the popup is open', async () => {
    // Breaks if the popup shares the adapter's in-flight token promise: every
    // request and the SignalR reconnect hang until the user closes it.
    msal.acquireTokenPopup = vi.fn(() => new Promise(() => undefined));
    void signInWithPopup();

    await expect(
      createMsalWebAdapter().getAccessToken({ silentOnly: true })
    ).resolves.toBe('test-token');
  });
});
