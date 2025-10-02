import { app as teamsApp } from '@microsoft/teams-js';

import { acquireNaaToken, naaInit } from '@/platform/auth/naaClient';

import { AuthAdapter } from '../types';

export function createTeamsNaaAdapter(): AuthAdapter {
  return {
    async getAccessToken() {
      try {
        await naaInit();
        const scopes = (import.meta.env.VITE_CLIENT_SCOPES as string | undefined)?.split(',') || [];
        return acquireNaaToken(scopes);
      } catch (error) {
        console.error('Teams NAA token acquisition failed:', error);
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
          return null;
        }
        
        return { 
          accountId: ctx.user.id, 
          displayName: ctx.user.displayName 
        };
      } catch (error) {
        console.error('Teams session retrieval failed:', error);
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
