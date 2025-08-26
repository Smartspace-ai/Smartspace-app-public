import { msalInstance } from '@/auth/msalClient';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { authentication } from '@microsoft/teams-js';
import axios from 'axios';
import { interactiveLoginRequest, isInTeams } from '../app/msalConfig';

function getBaseUrl() {
  const configBaseUrl =
    (window as any)?.ssconfig?.Chat_Api_Uri ||
    import.meta.env.VITE_CHAT_API_URI;
  const baseUrl = configBaseUrl;
  return baseUrl ? baseUrl : '';
}

const baseURL = getBaseUrl();
const webApi = axios.create({
  baseURL,
});

webApi.interceptors.request.use(async (config) => {
  // Avoid triggering MSAL flows while on the login screen
  try {
    const path = window.location?.pathname || ''
    if (path.startsWith('/login')) {
      return config
    }
  } catch {}

  const scopes = (
    (window as any)?.ssconfig?.Client_Scopes ||
    import.meta.env.VITE_CLIENT_SCOPES ||
    ''
  )
    .split(' ')
    .filter(
      (scope: string) => scope.indexOf('smartspaceapi.config.access') === -1
    );
  const request = {
    scopes: scopes,
  };
  try {
    const response = await msalInstance.acquireTokenSilent(request);
    config.headers.Authorization = `Bearer ${response.accessToken}`;
  } catch (error) {
    console.error('Error getting msal token:', error);
    
    // If the error is due to interaction required (like consent_required),
    // trigger an interactive authentication flow
    if (error instanceof InteractionRequiredAuthError) {
      const inTeamsEnvironment = isInTeams();
      
      try {
        // In Teams (desktop/mobile), get a token from Teams SDK (SSO) without UI
        if (inTeamsEnvironment) {
          const teamsToken = await authentication.getAuthToken({
            silent: true,
          });
          // Attach as Bearer if your API accepts it directly
          config.headers.Authorization = `Bearer ${teamsToken}`;
        } else {
          await msalInstance.loginRedirect(interactiveLoginRequest);
          return config;
        }
      } catch (interactiveError) {
        console.error('Interactive authentication failed:', interactiveError);
        
        // If we're in Teams and authentication fails, provide helpful messaging
        if (inTeamsEnvironment) {
          // Don't redirect in Teams - just log the error
        } else {
          // In web browsers, we could redirect to login page
          // window.location.href = '/login';
        }
      }
    }
  }

  return config;
});

export default webApi;