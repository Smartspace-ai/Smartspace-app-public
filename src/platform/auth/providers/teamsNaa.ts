import { acquireNaaToken, naaInit } from '@/platform/auth/naaClient';
import { app as teamsApp } from '@microsoft/teams-js';
import { AuthAdapter } from '../types';

export function createTeamsNaaAdapter(): AuthAdapter {
  return {
    async getAccessToken() {
      await naaInit();
      const scopes = (import.meta.env.VITE_CLIENT_SCOPES as string | undefined)?.split(',') || [];
      return acquireNaaToken(scopes);
    },
    async getSession() {
      try {
        await teamsApp.initialize();
        const ctx = await teamsApp.getContext();
        return { accountId: ctx.user?.id, displayName: ctx.user?.displayName };
      } catch { return null; }
    },
    async signIn() { /* Teams handles */ },
    async signOut() { /* no-op */ },
    getStoredRedirectUrl() {
      // Teams doesn't use redirect URLs in the same way
      return null;
    },
  };
}
