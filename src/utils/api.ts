import { InteractionRequiredAuthError } from '@azure/msal-browser';
import axios from 'axios';
import { interactiveLoginRequest, loginRequest, isInTeams } from '../app/msalConfig';
import { msalInstance } from '../main';

function getBaseUrl(): string {
  return import.meta.env.VITE_CHAT_API_URI || '';
}


export const API = axios.create({
  baseURL: getBaseUrl(),
});

API.interceptors.request.use(async (config) => {
  try {
    const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    if (!account) {
      // No cached account; trigger interactive auth
      const inTeamsEnvironment = isInTeams();
      if (inTeamsEnvironment) {
        await msalInstance.loginPopup({
          ...interactiveLoginRequest,
          redirectUri: undefined,
        });
      } else {
        await msalInstance.loginRedirect(interactiveLoginRequest);
        return config;
      }
    }

    const tokenResponse = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: msalInstance.getActiveAccount() || account,
    });

    config.headers?.set('Authorization', `Bearer ${tokenResponse.accessToken}`);

    return config;
  } catch (error) {
    console.error('[MSAL] Token acquisition failed:', error);
    
    // If the error is due to interaction required (like consent_required),
    // trigger an interactive authentication flow
    if (error instanceof InteractionRequiredAuthError) {
      const inTeamsEnvironment = isInTeams();
      console.log('[MSAL] Interactive authentication required, triggering login...');
      console.log('[MSAL] In Teams environment:', inTeamsEnvironment);
      
      try {
        const account = msalInstance.getActiveAccount();
        
        // Use popup in Teams, redirect in web browsers
        if (inTeamsEnvironment) {
          console.log('[MSAL] In Teams - using popup authentication');
          // Use a very explicit popup configuration for Teams
          await msalInstance.loginPopup({
            ...interactiveLoginRequest,
            redirectUri: undefined, // Don't use redirect URI for popup
          });
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
