import { app as teamsApp } from '@microsoft/teams-js';

import { acquireNaaToken, naaInit } from '@/platform/auth/naaClient';
import { setRuntimeAuthError } from '@/platform/auth/runtime';
import { getClientScopes } from '@/platform/auth/scopes';
import { ssInfo, ssWarn } from '@/platform/log';

import { AuthAdapter, type GetTokenOptions } from '../types';

export function createTeamsNaaAdapter(): AuthAdapter {
  return {
    async getAccessToken(opts?: GetTokenOptions) {
      try {
        ssInfo('auth:teams', 'getAccessToken start', {
          silentOnly: !!opts?.silentOnly,
          scopesProvided: !!opts?.scopes?.length,
        });
        await naaInit();
        const scopes = opts?.scopes?.length ? opts.scopes : getClientScopes();
        ssInfo('auth:teams', 'getAccessToken acquiring (no token will be logged)', {
          scopesCount: scopes.length,
          scopes: scopes,
          scopeSource: (opts?.scopes?.length ? 'callsite' : 'configured'),
        });
        const token = await acquireNaaToken(scopes, { silentOnly: !!opts?.silentOnly });
        setRuntimeAuthError(null);
        return token;
      } catch (error) {
        ssWarn('auth:teams', 'getAccessToken failed', error);
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
          ssWarn('auth:teams', 'teamsApp.initialize threw (ignored)', initError);
        }
        
        const ctx = await teamsApp.getContext();
        if (!ctx.user) {
          ssWarn('auth:teams', 'getSession: ctx.user missing', ctx);
          setRuntimeAuthError({ source: 'teams', message: 'Teams context missing user (ctx.user is empty)' });
          return null;
        }
        
        ssInfo('auth:teams', 'getSession success', { userId: ctx.user.id, hasDisplayName: !!ctx.user.displayName });
        setRuntimeAuthError(null);
        return { 
          accountId: ctx.user.id, 
          displayName: ctx.user.displayName 
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
    async signIn() { 
      // Teams: interactive token acquisition via popup can be required on some clients.
      // Keep this interactive flow in the auth/login layer (not in the API layer).
      await naaInit();
      const scopes = getClientScopes();
      await acquireNaaToken(scopes, { silentOnly: false });
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
