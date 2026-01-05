import { app as teamsApp } from '@microsoft/teams-js';

import { acquireNaaToken, naaInit } from '@/platform/auth/naaClient';
import { parseScopes } from '@/platform/auth/utils';

import type { AuthAdapter, GetTokenOptions } from '../types';

async function getTeamsSsoToken(): Promise<string> {
  // Works in older Teams clients where NAA may not be supported.
  // v2 teams-js: app.initialize + app.authentication.getAuthToken()
  try { await teamsApp.initialize(); } catch { /* ignore */ }
  const auth: any = (teamsApp as any).authentication;
  if (!auth || typeof auth.getAuthToken !== 'function') {
    throw new Error('Teams SSO is not available in this host');
  }
  const res = await auth.getAuthToken();
  // Some hosts return string, others object { token }
  if (typeof res === 'string') return res;
  if (res && typeof res === 'object' && typeof (res as any).token === 'string') return (res as any).token;
  throw new Error('Teams SSO did not return a token');
}

export function createTeamsNaaAdapter(): AuthAdapter {
  return {
    async getAccessToken(opts?: GetTokenOptions) {
      const scopes = opts?.scopes ?? parseScopes(import.meta.env.VITE_CLIENT_SCOPES);
      try {
        await naaInit();
        return await acquireNaaToken(scopes, { forceRefresh: !!opts?.forceRefresh, silentOnly: !!opts?.silentOnly });
      } catch (e) {
        // If NAA isn't supported in this Teams client (common in some desktop builds),
        // fall back to Teams SSO token acquisition so desktop and web both work.
        if (opts?.silentOnly) {
          // silentOnly should still be respected (route guard). getAuthToken is effectively silent in Teams.
          return await getTeamsSsoToken();
        }
        return await getTeamsSsoToken();
      }
    },

    async getSession() {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Initialize if needed; ignore if already initialized
          try { await teamsApp.initialize(); } catch { /* ignore */ }

          const ctx = await teamsApp.getContext();
          const user = (ctx as any)?.user;
          if (user) {
            return { accountId: user.id, displayName: user.displayName };
          }
        } catch {
          // ignore and retry
        }

        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 250 * attempt));
        }
      }
      return null;
    },

    // SSO is handled by Teams; these are no-ops by design
    async signIn() { /* no-op in Teams */ },
    async signOut() { /* no-op in Teams */ },

    getStoredRedirectUrl() { return null; },
  };
}
