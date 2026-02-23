import { CacheLookupPolicy } from '@azure/msal-browser';

import { getMsalInstance } from '@/platform/auth/msalClient';
import {
  interactiveLoginRequest,
  isInTeams,
  loginRequest,
} from '@/platform/auth/msalConfig';
import { ssInfo, ssWarn } from '@/platform/log';

import { setStoredUseMsalInTeams } from '../runtime';
import { AuthAdapter, GetTokenOptions, SignInOptions } from '../types';

/** Shared in-flight popup promise to prevent AADSTS50196 (client request loop). */
let inFlightPopupPromise: Promise<string> | null = null;
/** Cooldown after popup: avoid starting another popup for this many ms. */
const POPUP_COOLDOWN_MS = 8000;
let popupCooldownUntil = 0;

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
          // In Teams iframe, hidden-iframe token renewal is blocked by third-party
          // cookie restrictions. Limit to cache + refresh-token (both work in any context).
          ...(isInTeams() && {
            cacheLookupPolicy: CacheLookupPolicy.AccessTokenAndRefreshToken,
          }),
        });
        if (isInTeams()) setStoredUseMsalInTeams(true);
        return r.accessToken;
      } catch (e) {
        ssWarn('auth:web', 'acquireTokenSilent failed', e);
        // In Teams, try ssoSilent (hidden iframe — completely invisible) before
        // giving up on silent auth. Works when the user has an active Azure AD
        // session but the MSAL token cache is empty/partitioned.
        if (isInTeams() && opts?.silentOnly) {
          const account = msalInstance.getActiveAccount();
          const hint =
            account?.username ?? msalInstance.getAllAccounts()[0]?.username;
          if (hint) {
            try {
              ssInfo('auth:web', 'trying ssoSilent fallback', {
                loginHint: hint,
              });
              const r = await msalInstance.ssoSilent({
                ...loginRequest,
                loginHint: hint,
              });
              if (r?.account) msalInstance.setActiveAccount(r.account);
              setStoredUseMsalInTeams(true);
              return r.accessToken;
            } catch (ssoErr) {
              ssWarn('auth:web', 'ssoSilent fallback failed', ssoErr);
            }
          }
        }
        if (opts?.silentOnly) throw new Error('Silent token failed');
        // Cooldown: after a popup, retry silent first (token should be cached). Avoids AADSTS50196 loop.
        const now = Date.now();
        if (now < popupCooldownUntil) {
          await new Promise((r) => setTimeout(r, 500));
          const account = msalInstance.getActiveAccount();
          if (account) {
            try {
              const r = await msalInstance.acquireTokenSilent({
                ...loginRequest,
                account,
                ...(isInTeams() && {
                  cacheLookupPolicy:
                    CacheLookupPolicy.AccessTokenAndRefreshToken,
                }),
              });
              if (isInTeams()) setStoredUseMsalInTeams(true);
              return r.accessToken;
            } catch {
              /* fall through to throw */
            }
          }
          throw new Error('Silent token failed');
        }
        // Deduplicate: concurrent callers share one popup.
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
          popupCooldownUntil = Date.now() + POPUP_COOLDOWN_MS;
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
    async signIn(opts?: SignInOptions) {
      const redirectUrl =
        new URLSearchParams(window.location.search).get('redirect') ||
        '/workspace';
      sessionStorage.setItem('msalRedirectUrl', redirectUrl);
      if (isInTeams()) {
        // Build a loginHint from: caller-provided hint → cached account → nothing.
        const hint =
          opts?.loginHint ??
          msalInstance.getActiveAccount()?.username ??
          msalInstance.getAllAccounts()[0]?.username;
        ssInfo('auth:web', 'signIn -> loginPopup (Teams iframe)', {
          redirectUrl,
          hasLoginHint: !!hint,
        });
        // 1) ssoSilent — hidden iframe, completely invisible to the user.
        if (hint) {
          try {
            ssInfo('auth:web', 'trying ssoSilent (hidden iframe)', {
              loginHint: hint,
            });
            const ssoResult = await msalInstance.ssoSilent({
              ...loginRequest,
              loginHint: hint,
            });
            if (ssoResult?.account) {
              msalInstance.setActiveAccount(ssoResult.account);
              return;
            }
          } catch (ssoErr) {
            ssInfo('auth:web', 'ssoSilent failed, trying silent popup', ssoErr);
          }
        }
        // 2) loginPopup with prompt:'none' + loginHint — brief popup flash, auto-closes.
        if (hint) {
          try {
            const silentResult = await msalInstance.loginPopup({
              ...loginRequest,
              loginHint: hint,
            });
            if (silentResult?.account) {
              msalInstance.setActiveAccount(silentResult.account);
              return;
            }
          } catch (silentErr) {
            ssInfo(
              'auth:web',
              'silent loginPopup failed, falling back to interactive',
              silentErr
            );
          }
        }
        // Fall back to interactive popup (account selection)
        const popupResult = await msalInstance.loginPopup(
          interactiveLoginRequest
        );
        if (popupResult?.account) {
          msalInstance.setActiveAccount(popupResult.account);
        }
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
