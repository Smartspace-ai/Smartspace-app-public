import { interactiveLoginRequest, isInTeams, loginRequest } from '@/app/msalConfig';
import { msalInstance } from '@/domains/auth/msalClient';
import { acquireNaaToken } from '@/domains/auth/naaClient';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import axios from 'axios';

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
  } catch {
    // ignore
  }

  try {
    const inTeamsEnvironment = ((window as any)?.__teamsState?.isInTeams === true) || isInTeams();
    if (inTeamsEnvironment) {
      try {
        const scopes = [`api://e3f39d90-9235-435e-ba49-681727352613/smartspaceapi.chat.access`]
        const token = await acquireNaaToken(scopes)
        if (token) config.headers?.set('Authorization', `Bearer ${token}`)
      } catch {
        // ignore
      }
      return config
    }

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
    // If the error is due to interaction required (like consent_required), trigger an interactive flow
    if (error instanceof InteractionRequiredAuthError) {
      const inTeamsEnvironment = ((window as any)?.__teamsState?.isInTeams === true) || isInTeams();
      try {
        if (inTeamsEnvironment) {
          const scopes = [`api://e3f39d90-9235-435e-ba49-681727352613/smartspaceapi.chat.access`]
          const token = await acquireNaaToken(scopes)
          if (token) config.headers?.set('Authorization', `Bearer ${token}`)
        } else {
          await msalInstance.loginRedirect(interactiveLoginRequest);
          return config;
        }
      } catch {
        // ignore
      }
    }
    
    return config;
  }
});

export default API;
