import { app as teamsApp } from '@microsoft/teams-js';

import { acquireNaaToken, naaInit } from '@/platform/auth/naaClient';
import { parseScopes } from '@/platform/auth/utils';

import type { AuthAdapter, GetTokenOptions } from '../types';

export function createTeamsNaaAdapter(): AuthAdapter {
  return {
    async getAccessToken(opts?: GetTokenOptions) {
      await naaInit();
      const scopes = opts?.scopes ?? parseScopes(import.meta.env.VITE_CLIENT_SCOPES);
      return acquireNaaToken(scopes, { forceRefresh: !!opts?.forceRefresh, silentOnly: !!opts?.silentOnly });
    },

    async getSession() {
      try {
        // Initialize if needed; ignore if already initialized
        try { await teamsApp.initialize(); } catch {
          // ignore – app may already be initialized by host
        }
        const ctx = await teamsApp.getContext();
        const user = (ctx as any)?.user;
        if (!user) return null;
        return { accountId: user.id, displayName: user.displayName };
      } catch {
        return null;
      }
    },

    // SSO is handled by Teams; these are no-ops by design
    async signIn() { /* no-op in Teams */ },
    async signOut() { /* no-op in Teams */ },

    getStoredRedirectUrl() { return null; },
  };
}
