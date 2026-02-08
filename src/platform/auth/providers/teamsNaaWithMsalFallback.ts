import { ssInfo, ssWarn } from '@/platform/log';

import { createMsalWebAdapter } from './msalWeb';
import { createTeamsNaaAdapter } from './teamsNaa';
import type { AuthAdapter, GetTokenOptions } from '../types';

/** When true, NAA has failed and we use MSAL for all auth in this session. */
let useMsalFallback = false;

function setFallbackToMsal() {
  if (!useMsalFallback) {
    useMsalFallback = true;
    ssInfo('auth:teams', 'NAA failed -> using MSAL fallback for this session');
  }
}

/**
 * Teams auth adapter that tries NAA first and falls back to web MSAL when NAA fails.
 * MSAL will show a login popup inside Teams when used.
 */
export function createTeamsNaaWithMsalFallbackAdapter(): AuthAdapter {
  const naaAdapter = createTeamsNaaAdapter();
  const msalAdapter = createMsalWebAdapter();

  return {
    async getAccessToken(opts?: GetTokenOptions) {
      if (useMsalFallback) {
        return msalAdapter.getAccessToken(opts);
      }
      try {
        return await naaAdapter.getAccessToken(opts);
      } catch (error) {
        ssWarn(
          'auth:teams',
          'NAA getAccessToken failed, falling back to MSAL',
          error
        );
        setFallbackToMsal();
        return msalAdapter.getAccessToken(opts);
      }
    },

    async getSession() {
      if (useMsalFallback) {
        return msalAdapter.getSession();
      }
      try {
        const session = await naaAdapter.getSession();
        if (session) return session;
        const msalSession = await msalAdapter.getSession();
        if (msalSession) {
          setFallbackToMsal();
          return msalSession;
        }
        return null;
      } catch (error) {
        ssWarn(
          'auth:teams',
          'NAA getSession failed, falling back to MSAL',
          error
        );
        setFallbackToMsal();
        return msalAdapter.getSession();
      }
    },

    async signIn() {
      if (useMsalFallback) {
        await msalAdapter.getAccessToken({ silentOnly: false });
        return;
      }
      try {
        await naaAdapter.signIn();
      } catch (error) {
        ssWarn('auth:teams', 'NAA signIn failed, falling back to MSAL', error);
        setFallbackToMsal();
        await msalAdapter.getAccessToken({ silentOnly: false });
      }
    },

    async signOut() {
      if (useMsalFallback) {
        await msalAdapter.signOut();
        return;
      }
      naaAdapter.signOut();
    },

    getStoredRedirectUrl() {
      if (useMsalFallback) return msalAdapter.getStoredRedirectUrl();
      return naaAdapter.getStoredRedirectUrl();
    },
  };
}
