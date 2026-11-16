import { describe, expect, it, vi } from 'vitest';

import { TransientAuthError } from '@/platform/auth/errors';
import { getMsalInstance } from '@/platform/auth/msalClient';
import {
  checkWebTokenSilently,
  createMsalWebAdapter,
  refreshWebTokenSilently,
  signInWithPopup,
} from '@/platform/auth/providers/msalWeb';
import { isServerOrNetworkFailure } from '@/platform/envelopes';

// src/test/setup.ts mocks msalClient with a shared fake instance, which has
// no acquireTokenPopup; each test adds one.
const msal = getMsalInstance() as unknown as {
  acquireTokenSilent: ReturnType<typeof vi.fn>;
  getActiveAccount: ReturnType<typeof vi.fn>;
  getAllAccounts: ReturnType<typeof vi.fn>;
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

  it('the tab-visible check passes with no one signed in, so it starts no recovery', async () => {
    // Breaks if it throws: every tab switch on a signed-out page would raise
    // the sign-in prompt.
    msal.acquireTokenSilent.mockClear();
    msal.getActiveAccount.mockReturnValueOnce(null);
    msal.getAllAccounts.mockReturnValueOnce([]);

    await expect(checkWebTokenSilently()).resolves.toBeUndefined();
    expect(msal.acquireTokenSilent).not.toHaveBeenCalled();
  });

  it('the popup returns to the site root, the address every deployment registers', () => {
    // Breaks if it returns to auth-redirect.html: only Teams deployments
    // register that, and Entra rejects the sign-in with AADSTS50011.
    msal.acquireTokenPopup = vi.fn(() => new Promise(() => undefined));

    void signInWithPopup();

    expect(msal.acquireTokenPopup).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUri: `${window.location.origin}/`,
      })
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
    ['no_network_connectivity', true],
    ['post_request_failed', true],
    ['interaction_required', false],
  ])(
    'a silent token request that fails with %s is a network failure: %s',
    async (errorCode, networkFailure) => {
      // Breaks if the cause is dropped: an offline blip escalates like an
      // expired session. Or if every failure counts as the network: a dead
      // session never shows the prompt.
      msal.acquireTokenSilent.mockRejectedValueOnce(
        Object.assign(new Error(errorCode), { errorCode })
      );

      const error = await createMsalWebAdapter()
        .getAccessToken({ silentOnly: true })
        .catch((e: unknown) => e);

      expect(error instanceof TransientAuthError).toBe(networkFailure);
      // The route loaders show it inline, as any offline request.
      expect(isServerOrNetworkFailure(error)).toBe(networkFailure);
    }
  );

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
