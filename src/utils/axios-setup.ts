import { InteractionRequiredAuthError } from '@azure/msal-browser';
import axios from 'axios';
import { interactiveLoginRequest } from '../app/msalConfig';
import { msalInstance } from '../main';
import { performTeamsInteractiveAuth } from './teams-auth';

function getBaseUrl() {
  const configBaseUrl =
    (window as any)?.ssconfig?.Chat_Api_Uri ||
    import.meta.env.VITE_CHAT_API_URI;
  const baseUrl = configBaseUrl;
  return baseUrl ? baseUrl : '';
}

const webApi = axios.create({
  baseURL: getBaseUrl(),
});

webApi.interceptors.request.use(async (config) => {
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
      const inTeamsEnvironment = (window as any).__teamsState?.isInTeams ?? false;
      console.log('Interactive authentication required, triggering login...');
      console.log('In Teams environment:', inTeamsEnvironment);
      
      try {
        // Use Teams popup in Teams, redirect in web
        if (inTeamsEnvironment) {
          console.log('In Teams - using Teams authenticate popup with consent');
          const loginHint = (window as any).__teamsState?.teamsUser?.loginHint;
          await performTeamsInteractiveAuth(msalInstance, loginHint);
        } else {
          console.log('In web browser - using redirect authentication');
          await msalInstance.loginRedirect(interactiveLoginRequest);
          // Note: After redirect, this code won't continue executing
          // The page will reload and the user will be authenticated
          return config;
        }
        
        // After successful interactive login (popup only), retry token acquisition
        const response = await msalInstance.acquireTokenSilent(request);
        config.headers.Authorization = `Bearer ${response.accessToken}`;
      } catch (interactiveError) {
        console.error('Interactive authentication failed:', interactiveError);
        
        // If we're in Teams and authentication fails, provide helpful messaging
        if (inTeamsEnvironment) {
          console.log('Teams authentication failed. This might be due to popup blockers or Teams restrictions.');
          console.log('User may need to manually refresh the Teams app or try again.');
          // Don't redirect in Teams - just log the error
        } else {
          // In web browsers, we could redirect to login page
          console.log('Web authentication failed, could redirect to login');
          // window.location.href = '/login';
        }
      }
    }
  }

  return config;
});

export default webApi;
