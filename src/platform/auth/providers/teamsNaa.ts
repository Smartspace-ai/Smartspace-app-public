import { app as teamsApp } from '@microsoft/teams-js';

import { acquireNaaToken, naaInit } from '@/platform/auth/naaClient';
import { ssInfo, ssWarn } from '@/platform/log';

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
        ssInfo('auth:teams', 'getAccessToken start', {
          silentOnly: !!opts?.silentOnly,
          scopesProvided: !!opts?.scopes?.length,
        });
        await naaInit();
        const raw =
          (window as any)?.ssconfig?.Client_Scopes ??
          import.meta.env.VITE_CLIENT_SCOPES ??
          '';
        const scopes = opts?.scopes?.length ? opts.scopes : parseScopes(raw);
        ssInfo('auth:teams', 'getAccessToken acquiring (no token will be logged)', {
          scopesCount: scopes.length,
          scopes: scopes,
          scopeSource: (opts?.scopes?.length ? 'callsite' : ((window as any)?.ssconfig?.Client_Scopes ? 'ssconfig' : 'viteEnv')),
        });
        return acquireNaaToken(scopes);
      } catch (error) {
        console.error('Teams NAA token acquisition failed:', error);
        ssWarn('auth:teams', 'getAccessToken failed', error);
        try { (window as any).__teamsAuthLastError = String((error as any)?.message ?? error); } catch { /* ignore */ }
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
          console.log('Teams already initialized or not available');
          ssWarn('auth:teams', 'teamsApp.initialize threw (ignored)', initError);
        }
        
        const ctx = await teamsApp.getContext();
        if (!ctx.user) {
          console.warn('No user context available in Teams');
          ssWarn('auth:teams', 'getSession: ctx.user missing', ctx);
          try { (window as any).__teamsAuthLastError = 'Teams context missing user (ctx.user is empty)'; } catch { /* ignore */ }
          return null;
        }
        
        ssInfo('auth:teams', 'getSession success', { userId: ctx.user.id, hasDisplayName: !!ctx.user.displayName });
        return { 
          accountId: ctx.user.id, 
          displayName: ctx.user.displayName 
        };
      } catch (error) {
        console.error('Teams session retrieval failed:', error);
        ssWarn('auth:teams', 'getSession failed', error);
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
