import { Configuration, PopupRequest } from '@azure/msal-browser';

import { parseScopes } from '@/platform/auth/scopes';

// Environment variables (provided via Vite)
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const AUTHORITY = import.meta.env.VITE_CLIENT_AUTHORITY;
const CHAT_API_URI = import.meta.env.VITE_CHAT_API_URI;
const CUSTOM_SCOPES = parseScopes(import.meta.env.VITE_CLIENT_SCOPES);
const TEAMS_SSO_RESOURCE = import.meta.env.VITE_TEAMS_SSO_RESOURCE;

// Microsoft Graph scopes and endpoints
const GRAPH_SCOPES = ['profile', 'openid'];
const GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';
const GRAPH_PHOTO_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/photo/$value';

export const handleTrailingSlash = (url: string): string => {
  return url.endsWith('/') ? url : `${url}/`;
};

// Check if we're running in Teams
const isInTeams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const inTeamsParam = urlParams.get('inTeams') === 'true';
  const parentCheck = window.parent !== window;
  
  return inTeamsParam || parentCheck;
};

// MSAL configuration object
const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: AUTHORITY,
    redirectUri: handleTrailingSlash(window.location.origin),
    postLogoutRedirectUri: handleTrailingSlash(window.location.origin),
    // For Teams, we need to support popup flows
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage', // Persists auth state across tabs/sessions
    storeAuthStateInCookie: false, // Recommended false unless supporting legacy browsers
  },
  system: {
    allowNativeBroker: false, // Only relevant for native/mobile clients
    // In Teams, we prefer popup flows over redirects
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
  },
};

// Token request configurations
export const loginRequest: PopupRequest = {
  scopes: [...CUSTOM_SCOPES, ...GRAPH_SCOPES],
  prompt: 'none',
  extraQueryParameters: {
    domain_hint: 'organizations', // Prioritize work/school accounts
  },
};

// Fallback login request when silent auth fails
export const interactiveLoginRequest: PopupRequest = {
  scopes: [...CUSTOM_SCOPES, ...GRAPH_SCOPES],
  prompt: 'select_account',
  extraQueryParameters: {
    domain_hint: 'organizations',
  },
};

// Teams-specific login request for SSO scenarios
export const teamsLoginRequest: PopupRequest = {
  scopes: [...CUSTOM_SCOPES, ...GRAPH_SCOPES],
};

// API endpoints used across the app
export const apiConfig = {
  chatApiUri: CHAT_API_URI,
};

export const graphConfig = {
  graphMeEndpoint: GRAPH_ME_ENDPOINT,
  graphPhotoEndpoint: GRAPH_PHOTO_ENDPOINT,
};

export const getTeamsResource = (): string => {
  if (TEAMS_SSO_RESOURCE && typeof TEAMS_SSO_RESOURCE === 'string') {
    return TEAMS_SSO_RESOURCE;
  }
  // Reasonable default when Application ID URI is not explicitly provided
  try {
    const host = window.location.host;
    return `api://${host}/${CLIENT_ID}`;
  } catch {
    return `api://${CLIENT_ID}`;
  }
};

export { isInTeams, msalConfig };
export default msalConfig;
