import { acquireNaaToken, naaInit } from '@/platform/auth/naaClient';
import { app as teamsApp } from '@microsoft/teams-js';
import { AuthAdapter, type GetTokenOptions } from '../types';

function parseScopes(raw: unknown): string[] {
  return String(raw ?? '')
    .split(/[ ,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function createTeamsNaaAdapter(): AuthAdapter {
  return {
    async getAccessToken(opts?: GetTokenOptions) {
      try {
        await naaInit();
        const raw =
          (window as any)?.ssconfig?.Client_Scopes ??
          import.meta.env.VITE_CLIENT_SCOPES ??
          '';
        const scopes = opts?.scopes?.length ? opts.scopes : parseScopes(raw);
        return acquireNaaToken(scopes);
      } catch (error) {
        console.error('Teams NAA token acquisition failed:', error);
        try { (window as any).__teamsAuthLastError = String((error as any)?.message ?? error); } catch { /* ignore */ }
        throw error;
      }
    },
    async getSession() {
      try {
        // Try to initialize Teams if not already done
        try {
          await teamsApp.initialize();
        } catch (initError) {
          // Teams might already be initialized, ignore this error
          console.log('Teams already initialized or not available');
        }
        
        const ctx = await teamsApp.getContext();
        if (!ctx.user) {
          console.warn('No user context available in Teams');
          try { (window as any).__teamsAuthLastError = 'Teams context missing user (ctx.user is empty)'; } catch { /* ignore */ }
          return null;
        }
        
        return { 
          accountId: ctx.user.id, 
          displayName: ctx.user.displayName 
        };
      } catch (error) {
        console.error('Teams session retrieval failed:', error);
        try { (window as any).__teamsAuthLastError = String((error as any)?.message ?? error); } catch { /* ignore */ }
        return null;
      }
    },
    async signIn() { 
      // Teams handles authentication through SSO
      console.log('Teams sign-in requested - handled by Teams SSO');
    },
    async signOut() { 
      // Teams handles sign-out
      console.log('Teams sign-out requested - handled by Teams');
    },
    getStoredRedirectUrl() {
      // Teams doesn't use redirect URLs in the same way
      return null;
    },
  };
}
