import { msalInstance } from '@/platform/auth/msalClient';
import { interactiveLoginRequest, resolvedClientId } from '@/platform/auth/msalConfig';
import { ensureMsalActiveAccount } from '@/platform/auth/msalActiveAccount';
import { normalizeRedirectPath, parseScopes } from '@/platform/auth/utils';

import type { AuthAdapter, GetTokenOptions } from '../types';

export function createMsalWebAdapter(): AuthAdapter {
  const ensureActive = async () => ensureMsalActiveAccount(msalInstance);

  return {
    async getAccessToken(opts?: GetTokenOptions) {
      if (!resolvedClientId) throw new Error('MSAL is not configured: missing Client ID');
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
    async signIn(redirectTo?: string) {
      if (!resolvedClientId) throw new Error('MSAL is not configured: missing Client ID');
      // Persist intended redirect, default to /workspace.
      // IMPORTANT: do not read window.location.search here; callers should pass the redirect explicitly.
      const redirectUrl = normalizeRedirectPath(redirectTo ?? null, '/workspace');
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
