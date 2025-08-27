import { msalInstance } from '@/domains/auth/msalClient';
import { acquireNaaToken } from '@/domains/auth/naaClient';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
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

  const inTeamsEnvironment = ((window as any)?.__teamsState?.isInTeams === true) || isInTeams();

  // Teams: use NAA to get delegated API token (no fallback)
  if (inTeamsEnvironment) {
    try {
      const scopes = [`api://e3f39d90-9235-435e-ba49-681727352613/smartspaceapi.chat.access`]
      const token = await acquireNaaToken(scopes)
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {
      // Leave request unauthenticated on failure
    }
    return config
  }

  // Web (non-Teams): use MSAL
  const scopes = (
    (window as any)?.ssconfig?.Client_Scopes ||
    import.meta.env.VITE_CLIENT_SCOPES ||
    ''
  )
    .split(' ')
    .filter((scope: string) => scope.indexOf('smartspaceapi.config.access') === -1);
  const request = { scopes };
  try {
    const response = await msalInstance.acquireTokenSilent(request);
    config.headers.Authorization = `Bearer ${response.accessToken}`;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      try {
        await msalInstance.loginRedirect(interactiveLoginRequest);
      } catch {}
    }
  }

  return config;
});

export default webApi;