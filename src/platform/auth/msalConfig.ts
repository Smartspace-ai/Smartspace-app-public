import { Configuration, type RedirectRequest } from '@azure/msal-browser';

import { getApiScopes, getAuthority, getClientId, getRedirectUri, getTeamsSsoResource } from '@/platform/auth/config';

const RESOLVED_CLIENT_ID = getClientId();
const RESOLVED_AUTHORITY = getAuthority();
const REDIRECT_URI = getRedirectUri();
const CUSTOM_SCOPES = getApiScopes();

// Microsoft Graph scopes and endpoints
const GRAPH_SCOPES = ['profile', 'openid'];
const GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';
const GRAPH_PHOTO_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/photo/$value';

export const handleTrailingSlash = (url: string): string => {
  return url.endsWith('/') ? url : `${url}/`;
};

// MSAL configuration object
const msalConfig: Configuration = {
  auth: {
    clientId: RESOLVED_CLIENT_ID,
    authority: RESOLVED_AUTHORITY,
    // Keep trailing slash for backwards compatibility with existing app registrations.
    // If you change this, ensure every environment's Redirect URI matches EXACTLY in AAD.
    redirectUri: handleTrailingSlash(REDIRECT_URI),
    postLogoutRedirectUri: handleTrailingSlash(REDIRECT_URI),
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
export const loginRequest: RedirectRequest = {
  scopes: [...CUSTOM_SCOPES, ...GRAPH_SCOPES],
  prompt: 'none',
  extraQueryParameters: {
    domain_hint: 'organizations', // Prioritize work/school accounts
  },
};

// Fallback login request when silent auth fails
export const interactiveLoginRequest: RedirectRequest = {
  scopes: [...CUSTOM_SCOPES, ...GRAPH_SCOPES],
  prompt: 'select_account',
  extraQueryParameters: {
    domain_hint: 'organizations',
  },
};

// Teams-specific login request for SSO scenarios
export const teamsLoginRequest: RedirectRequest = {
  scopes: [...CUSTOM_SCOPES, ...GRAPH_SCOPES],
};

// API endpoints used across the app
export const apiConfig = {
  // Note: API base URL is read directly in transport (supports runtime ssconfig).
  chatApiUri: (import.meta as any)?.env?.VITE_CHAT_API_URI,
};

export const graphConfig = {
  graphMeEndpoint: GRAPH_ME_ENDPOINT,
  graphPhotoEndpoint: GRAPH_PHOTO_ENDPOINT,
};

export const getTeamsResource = (): string => {
  const resourceOverride = getTeamsSsoResource();
  if (resourceOverride) return resourceOverride;
  // Reasonable default when Application ID URI is not explicitly provided
  try {
    const host = window.location.host;
    return `api://${host}/${RESOLVED_CLIENT_ID}`;
  } catch {
    return `api://${RESOLVED_CLIENT_ID}`;
  }
};

export const resolvedClientId = RESOLVED_CLIENT_ID;
export const resolvedAuthority = RESOLVED_AUTHORITY;
export { msalConfig };
export default msalConfig;
