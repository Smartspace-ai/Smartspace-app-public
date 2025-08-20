import { InteractionRequiredAuthError } from '@azure/msal-browser';
import axios from 'axios';
import { interactiveLoginRequest, loginRequest } from '../app/msalConfig';
import { msalInstance } from '../main';
import { performTeamsInteractiveAuth } from './teams-auth';

function getBaseUrl(): string {
  return import.meta.env.VITE_CHAT_API_URI || '';
}


export const API = axios.create({
  baseURL: getBaseUrl(),
});

API.interceptors.request.use(async (config) => {
  try {
    const account = msalInstance.getActiveAccount();
    if (!account) {
      throw new Error(
        'No active account! Verify a user has been signed in and setActiveAccount has been called.'
      );
    }

    const tokenResponse = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });

    config.headers?.set('Authorization', `Bearer ${tokenResponse.accessToken}`);

    return config;
  } catch (error) {
    console.error('[MSAL] Token acquisition failed:', error);
    
    // If the error is due to interaction required (like consent_required),
    // trigger an interactive authentication flow
    if (error instanceof InteractionRequiredAuthError) {
      const inTeamsEnvironment = (window as any).__teamsState?.isInTeams ?? false;
      console.log('[MSAL] Interactive authentication required, triggering login...');
      console.log('[MSAL] In Teams environment:', inTeamsEnvironment);
      
      try {
        if (inTeamsEnvironment) {
          console.log('[MSAL] In Teams - using Teams authenticate popup with consent');
          const loginHint = (window as any).__teamsState?.teamsUser?.loginHint;
          await performTeamsInteractiveAuth(msalInstance, loginHint);
        } else {
          console.log('[MSAL] In web browser - using redirect authentication');
          await msalInstance.loginRedirect(interactiveLoginRequest);
          // Note: After redirect, this code won't continue executing
          // The page will reload and the user will be authenticated
          return config;
        }
        
        // After successful interactive login (popup only), retry token acquisition
        const updatedAccount = msalInstance.getActiveAccount();
        if (!updatedAccount) {
          throw new Error('No active account after interactive login');
        }
        
        const tokenResponse = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: updatedAccount,
        });
        
        config.headers?.set('Authorization', `Bearer ${tokenResponse.accessToken}`);
      } catch (interactiveError) {
        console.error('[MSAL] Interactive authentication failed:', interactiveError);
        
        // If we're in Teams and authentication fails, provide helpful messaging
        if (inTeamsEnvironment) {
          console.log('[MSAL] Teams authentication failed. This might be due to popup blockers or Teams restrictions.');
          console.log('[MSAL] User may need to manually refresh the Teams app or try again.');
          // Don't redirect in Teams - just log the error
        } else {
          // In web browsers, we could redirect to login page
          console.log('[MSAL] Web authentication failed, could redirect to login');
          // window.location.href = '/login';
        }
      }
    }
    
    return config;
  }
});

export default API;
