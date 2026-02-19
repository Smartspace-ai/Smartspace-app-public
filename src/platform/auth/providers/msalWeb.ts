import { getMsalInstance } from '@/platform/auth/msalClient';
import {
  interactiveLoginRequest,
  isInTeams,
  loginRequest,
} from '@/platform/auth/msalConfig';
import { ssInfo, ssWarn } from '@/platform/log';

import { setStoredUseMsalInTeams } from '../runtime';
import { AuthAdapter, GetTokenOptions } from '../types';

/** Shared in-flight popup promise to prevent AADSTS50196 (client request loop). */
let inFlightPopupPromise: Promise<string> | null = null;

export function createMsalWebAdapter(): AuthAdapter {
  const msalInstance = getMsalInstance();
  async function ensureActive() {
    const current = msalInstance.getActiveAccount();
    const all = msalInstance.getAllAccounts();
    if (!current && all.length > 0) msalInstance.setActiveAccount(all[0]);
  }
  return {
    async getAccessToken(opts?: GetTokenOptions) {
      await ensureActive();
      const acct = msalInstance.getActiveAccount();
      ssInfo('auth:web', 'getAccessToken start', {
        hasActiveAccount: !!acct,
        accountsCached: msalInstance.getAllAccounts().length,
        silentOnly: !!opts?.silentOnly,
      });
      if (!acct) {
        if (opts?.silentOnly) throw new Error('No active account');
        await msalInstance.loginPopup(interactiveLoginRequest);
        await ensureActive();
      }
      try {
        const account = msalInstance.getActiveAccount();
        if (!account) throw new Error('No active account');
        const r = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account,
        });
        if (isInTeams()) setStoredUseMsalInTeams(true);
        return r.accessToken;
      } catch (e) {
        ssWarn('auth:web', 'acquireTokenSilent failed', e);
        if (opts?.silentOnly && !isInTeams())
          throw new Error('Silent token failed');
        // Deduplicate: concurrent callers share one popup to avoid AADSTS50196 (client request loop).
        if (inFlightPopupPromise) return inFlightPopupPromise;
        inFlightPopupPromise = (async () => {
          const account = msalInstance.getActiveAccount();
          const popupRequest = account
            ? { ...loginRequest, account }
            : interactiveLoginRequest;
          let r;
          try {
            r = await msalInstance.acquireTokenPopup(popupRequest);
          } catch (popupErr) {
            const needsInteraction =
              popupErr &&
              typeof popupErr === 'object' &&
              'errorCode' in popupErr &&
              (popupErr.errorCode === 'interaction_required' ||
                popupErr.errorCode === 'login_required');
            if (needsInteraction && account) {
              r = await msalInstance.acquireTokenPopup(interactiveLoginRequest);
            } else {
              throw popupErr;
            }
          }
          if (isInTeams()) setStoredUseMsalInTeams(true);
          return r.accessToken;
        })().finally(() => {
          inFlightPopupPromise = null;
        });
        return inFlightPopupPromise;
      }
    },
    async getSession() {
      await ensureActive();
      const a =
        msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
      ssInfo('auth:web', 'getSession', { hasSession: !!a });
      return a
        ? { accountId: a.homeAccountId, displayName: a.name ?? undefined }
        : null;
    },
    async signIn() {
      const redirectUrl =
        new URLSearchParams(window.location.search).get('redirect') ||
        '/workspace';
      sessionStorage.setItem('msalRedirectUrl', redirectUrl);
      if (isInTeams()) {
        ssInfo('auth:web', 'signIn -> loginPopup (Teams iframe)', {
          redirectUrl,
        });
        await msalInstance.loginPopup(interactiveLoginRequest);
      } else {
        ssInfo('auth:web', 'signIn -> loginRedirect', { redirectUrl });
        await msalInstance.loginRedirect(interactiveLoginRequest);
      }
    },
    async signOut() {
      if (isInTeams()) setStoredUseMsalInTeams(false);
      await msalInstance.logoutPopup();
    },
    getStoredRedirectUrl() {
      try {
        return sessionStorage.getItem('msalRedirectUrl');
      } catch {
        return null;
      }
    },
  };
}
