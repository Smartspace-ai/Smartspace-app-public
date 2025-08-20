import { InteractionRequiredAuthError } from '@azure/msal-browser';
import axios from 'axios';
import { interactiveLoginRequest, isInTeams, loginRequest } from '../app/msalConfig';
import { msalInstance } from '@/auth/msalClient';

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
    // console.error('Token acquisition failed:', error);
    
    // If the error is due to interaction required (like consent_required),
    // trigger an interactive authentication flow
    if (error instanceof InteractionRequiredAuthError) {
      const inTeamsEnvironment = isInTeams();
      // console.log('Interactive auth required. Teams:', inTeamsEnvironment);
      
      try {
        const account = msalInstance.getActiveAccount();
        
        // Use popup in Teams, redirect in web browsers
        if (inTeamsEnvironment) {
          // Use a very explicit popup configuration for Teams
          await msalInstance.loginPopup({
            ...interactiveLoginRequest,
            redirectUri: undefined, // Don't use redirect URI for popup
            prompt: 'consent', // Explicitly request consent
          });
        } else {
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
        // console.error('Interactive authentication failed:', interactiveError);
        
        // If we're in Teams and authentication fails, provide helpful messaging
        if (inTeamsEnvironment) {
          // Don't redirect in Teams - just log the error
        } else {
          // In web browsers, we could redirect to login page
          // window.location.href = '/login';
        }
      }
    }
    
    return config;
  }
});

export default API;