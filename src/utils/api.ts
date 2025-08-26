import { msalInstance } from '@/auth/msalClient';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { authentication } from '@microsoft/teams-js';
import axios from 'axios';
import { getTeamsResource, interactiveLoginRequest, isInTeams, loginRequest } from '../app/msalConfig';

function getBaseUrl(): string {
  return import.meta.env.VITE_CHAT_API_URI || '';
}


export const API = axios.create({
  baseURL: getBaseUrl(),
});

API.interceptors.request.use(async (config) => {
  // Avoid triggering MSAL or Teams token while on the login screen
  try {
    const path = window.location?.pathname || ''
    if (path.startsWith('/login')) {
      return config
    }
  } catch {}

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
      
      try {
        if (inTeamsEnvironment) {
          // Teams desktop/mobile: get a silent SSO token via Teams SDK
          const resource = getTeamsResource();
          const teamsToken = await authentication.getAuthToken({ silent: true, resources: [resource] });
          config.headers?.set('Authorization', `Bearer ${teamsToken}`);
        } else {
          await msalInstance.loginRedirect(interactiveLoginRequest);
          return config;
        }
      } catch (interactiveError) {
        // console.error('Interactive authentication failed:', interactiveError);
        // No redirect in Teams
      }
    }
    
    return config;
  }
});

export default API;