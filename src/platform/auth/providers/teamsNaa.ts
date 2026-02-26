import { CacheLookupPolicy } from '@azure/msal-browser';
import { app as teamsApp } from '@microsoft/teams-js';

import { getMsalInstance } from '@/platform/auth/msalClient';
import { loginRequest } from '@/platform/auth/msalConfig';
import { acquireNaaToken, naaInit } from '@/platform/auth/naaClient';
import { setRuntimeAuthError } from '@/platform/auth/runtime';
import { getClientScopes } from '@/platform/auth/scopes';
import {
  authenticateViaTeamsSdk,
  setActiveAccountFromTeamsAuth,
} from '@/platform/auth/teamsAuthHelper';
import { ssInfo, ssWarn } from '@/platform/log';

import {
  AuthAdapter,
  type GetTokenOptions,
  type SignInOptions,
} from '../types';

export function createTeamsNaaAdapter(): AuthAdapter {
  /**
   * Fallback when NAA token acquisition fails: use the Teams SDK
   * authentication popup to run MSAL loginRedirect in a Teams-controlled
   * window, then retry silent token acquisition from the shared cache.
   */
  async function acquireMsalFallbackToken(scopes: string[]) {
    const msalInstance = getMsalInstance();
    const current = msalInstance.getActiveAccount();
    const all = msalInstance.getAllAccounts();
    if (!current && all.length > 0) msalInstance.setActiveAccount(all[0]);

    const active = msalInstance.getActiveAccount();
    const hint = active?.username ?? all[0]?.username;

    ssInfo('auth:teams', 'NAA fallback -> Teams SDK auth popup');
    const result = await authenticateViaTeamsSdk(hint);
    setActiveAccountFromTeamsAuth(msalInstance, result.homeAccountId);

    // After the popup, tokens are cached in localStorage. Acquire silently.
    const account = msalInstance.getActiveAccount();
    if (!account) {
      // On Mobile, the MSAL cache may be partitioned. Use popup token directly.
      if (result.accessToken) {
        ssInfo('auth:teams', 'NAA MSAL fallback using popup token directly');
        return result.accessToken;
      }
      throw new Error('No active account after Teams auth');
    }

    try {
      const r = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        scopes,
        account,
        cacheLookupPolicy: CacheLookupPolicy.AccessTokenAndRefreshToken,
      });
      return r.accessToken;
    } catch (silentErr) {
      ssWarn('auth:teams', 'NAA MSAL fallback silent failed', silentErr);
      if (result.accessToken) {
        ssInfo('auth:teams', 'NAA MSAL fallback using popup token directly');
        return result.accessToken;
      }
      throw silentErr;
    }
  }

  return {
    async getAccessToken(opts?: GetTokenOptions) {
      try {
        ssInfo('auth:teams', 'getAccessToken start', {
          silentOnly: !!opts?.silentOnly,
          scopesProvided: !!opts?.scopes?.length,
        });
        await naaInit();
        const scopes = opts?.scopes?.length ? opts.scopes : getClientScopes();
        ssInfo(
          'auth:teams',
          'getAccessToken acquiring (no token will be logged)',
          {
            scopesCount: scopes.length,
            scopes: scopes,
            scopeSource: opts?.scopes?.length ? 'callsite' : 'configured',
          }
        );
        const token = await acquireNaaToken(scopes, {
          silentOnly: !!opts?.silentOnly,
        });
        setRuntimeAuthError(null);
        return token;
      } catch (error) {
        ssWarn('auth:teams', 'getAccessToken failed', error);
        if (!opts?.silentOnly) {
          try {
            const popupToken = await acquireMsalFallbackToken(
              opts?.scopes?.length ? opts.scopes : getClientScopes()
            );
            setRuntimeAuthError(null);
            return popupToken;
          } catch (popupError) {
            ssWarn('auth:teams', 'MSAL fallback failed', popupError);
            setRuntimeAuthError({
              source: 'teams',
              message: String(
                popupError instanceof Error ? popupError.message : popupError
              ),
            });
            throw popupError;
          }
        }
        setRuntimeAuthError({
          source: 'teams',
          message: String(error instanceof Error ? error.message : error),
        });
        throw error;
      }
    },
    async getSession() {
      try {
        ssInfo('auth:teams', 'getSession start');
        // Try to initialize Teams if not already done
        try {
          await teamsApp.initialize();
        } catch (initError) {
          // Teams might already be initialized, ignore this error
          ssWarn(
            'auth:teams',
            'teamsApp.initialize threw (ignored)',
            initError
          );
        }

        const ctx = await teamsApp.getContext();
        if (!ctx.user) {
          ssWarn('auth:teams', 'getSession: ctx.user missing', ctx);
          setRuntimeAuthError({
            source: 'teams',
            message: 'Teams context missing user (ctx.user is empty)',
          });
          return null;
        }

        ssInfo('auth:teams', 'getSession success', {
          userId: ctx.user.id,
          hasDisplayName: !!ctx.user.displayName,
        });
        setRuntimeAuthError(null);
        return {
          accountId: ctx.user.id,
          displayName: ctx.user.displayName,
        };
      } catch (error) {
        ssWarn('auth:teams', 'getSession failed', error);
        setRuntimeAuthError({
          source: 'teams',
          message: String(error instanceof Error ? error.message : error),
        });
        return null;
      }
    },
    async signIn(_opts?: SignInOptions) {
      // Teams: interactive token acquisition via popup can be required on some clients.
      // Keep this interactive flow in the auth/login layer (not in the API layer).
      await naaInit();
      const scopes = getClientScopes();
      try {
        await acquireNaaToken(scopes, { silentOnly: false });
      } catch (error) {
        ssWarn(
          'auth:teams',
          'signIn NAA failed, trying Teams SDK auth fallback',
          error
        );
        await acquireMsalFallbackToken(scopes);
      }
    },
    async signOut() {
      // Teams handles sign-out
      ssInfo('auth:teams', 'signOut requested - handled by Teams');
    },
    getStoredRedirectUrl() {
      // Teams doesn't use redirect URLs in the same way
      return null;
    },
  };
}
