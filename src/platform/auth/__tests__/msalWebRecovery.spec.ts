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

  it('calls MSAL acquireTokenPopup synchronously', () => {
    // Breaks if signInWithPopup awaits first (or goes through the adapter's
    // silent step): the popup can open after the click's allowance is gone.
    // That MSAL itself opens the window before its first await was checked
    // in the msal-browser 3.30 source, not here.
    msal.acquireTokenPopup = vi.fn(() => new Promise(() => undefined));

    void signInWithPopup();

    expect(msal.acquireTokenPopup).toHaveBeenCalledTimes(1);
  });

  it("does not hold the adapter's in-flight token request, so silent token requests carry on", async () => {
    // Breaks if the popup becomes the adapter's in-flight token promise:
    // every request and the SignalR reconnect hang until the user closes it.
    msal.acquireTokenPopup = vi.fn(() => new Promise(() => undefined));
    void signInWithPopup();

    await expect(
      createMsalWebAdapter().getAccessToken({ silentOnly: true })
    ).resolves.toBe('test-token');
  });

  it.each([
    ['the same account', 'test-home-id', false],
    ['a different account', 'other-home-id', true],
  ])(
    'reports whether the popup signed in %s',
    async (_name, homeAccountId, switchedAccount) => {
      // Breaks if a switch goes unreported: the page carries on as the
      // previous user instead of reloading.
      msal.acquireTokenPopup = vi.fn(async () => ({
        account: { homeAccountId },
      }));

      await expect(signInWithPopup()).resolves.toEqual({ switchedAccount });
    }
  );
});
