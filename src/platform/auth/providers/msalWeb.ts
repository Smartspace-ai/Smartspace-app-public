import { msalInstance } from '@/platform/auth/msalClient';
import { interactiveLoginRequest, loginRequest } from '@/platform/auth/msalConfig';
import { AuthAdapter, GetTokenOptions } from '../types';

export function createMsalWebAdapter(): AuthAdapter {
  async function ensureActive() {
    const current = msalInstance.getActiveAccount();
    const all = msalInstance.getAllAccounts();
    if (!current && all.length > 0) msalInstance.setActiveAccount(all[0]);
  }
  return {
    async getAccessToken(opts?: GetTokenOptions) {
      await ensureActive();
      const acct = msalInstance.getActiveAccount();
      if (!acct) {
        if (opts?.silentOnly) throw new Error('No active account');
        await msalInstance.loginPopup(interactiveLoginRequest);
      }
      try {
        const r = await msalInstance.acquireTokenSilent({ ...loginRequest, account: msalInstance.getActiveAccount()! });
        return r.accessToken;
      } catch {
        if (opts?.silentOnly) throw new Error('Silent token failed');
        // Use the same interactive request as sign-in for consistency
        const r = await msalInstance.acquireTokenPopup(interactiveLoginRequest);
        return r.accessToken;
      }
    },
    async getSession() {
      await ensureActive();
      const a = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
      return a ? { accountId: a.homeAccountId, displayName: a.name ?? undefined } : null;
    },
    async signIn() { 
      // Store the intended redirect URL before redirecting
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/workspace';
      sessionStorage.setItem('msalRedirectUrl', redirectUrl);
      await msalInstance.loginRedirect(interactiveLoginRequest); 
    },
    async signOut() { await msalInstance.logoutPopup(); },
    getStoredRedirectUrl() {
      try {
        return sessionStorage.getItem('msalRedirectUrl');
      } catch {
        return null;
      }
    },
  };
}
