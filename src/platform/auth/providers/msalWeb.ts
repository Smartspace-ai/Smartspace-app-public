import { msalInstance } from '@/platform/auth/msalClient';
import { interactiveLoginRequest } from '@/platform/auth/msalConfig';
import { ensureMsalActiveAccount } from '@/platform/auth/msalActiveAccount';
import { normalizeRedirectPath, parseScopes } from '@/platform/auth/utils';

import type { AuthAdapter, GetTokenOptions } from '../types';

export function createMsalWebAdapter(): AuthAdapter {
  const ensureActive = async () => ensureMsalActiveAccount(msalInstance);

  return {
    async getAccessToken(opts?: GetTokenOptions) {
      await ensureActive();
      const scopes = opts?.scopes ?? parseScopes(import.meta.env.VITE_CLIENT_SCOPES);
      const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];

      if (!account && opts?.silentOnly) {
        throw new Error('No active account');
      }

      // Best practice: token acquisition should be side-effect free (no popup/redirect) unless
      // explicitly initiated by the user via signIn(). Route guards handle interactive sign-in.
      const res = await msalInstance.acquireTokenSilent({
        account: account ?? undefined,
        scopes,
        forceRefresh: !!opts?.forceRefresh,
      });
      return res.accessToken;
    },

    async getSession() {
      await ensureActive();
      const a = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
      return a ? { accountId: a.homeAccountId, displayName: a.name ?? a.username } : null;
    },

    // Use redirect for sign-in (your current behavior)
    async signIn() {
      // Persist intended redirect, default to /workspace (tweak to your app)
      const redirectUrl = normalizeRedirectPath(
        new URLSearchParams(window.location.search).get('redirect'),
        '/workspace'
      );
      try { sessionStorage.setItem('msalRedirectUrl', redirectUrl); } catch {
        // no session storage; no redirect handled in the app
      }
      await msalInstance.loginRedirect(interactiveLoginRequest);
    },

    async signOut() {
      await msalInstance.logoutRedirect();
    },

    getStoredRedirectUrl() {
      try { return sessionStorage.getItem('msalRedirectUrl'); } catch { return null; }
    },
    clearStoredRedirectUrl() {
      try { sessionStorage.removeItem('msalRedirectUrl'); } catch { /* noop */ }
    },
  };
}
