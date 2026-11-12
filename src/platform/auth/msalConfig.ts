import { Configuration, PopupRequest } from '@azure/msal-browser';

import { getClientScopesRaw, parseScopes } from '@/platform/auth/scopes';
import { missingSsConfigKeys, ssConfig } from '@/platform/config/ssConfig';

// '' rather than undefined: MSAL's config types want a string, and
// getAuthConfigIssue() stops startup before an empty one is used.
const CLIENT_ID = ssConfig('Client_Id') ?? '';
const TENANT_ID = ssConfig('Tenant_Id');
const AUTHORITY =
  ssConfig('Client_Authority') ??
  (TENANT_ID ? `https://login.microsoftonline.com/${TENANT_ID}` : undefined);
const CHAT_API_URI = ssConfig('Chat_Api_Uri');
const CUSTOM_SCOPES = parseScopes(getClientScopesRaw());
const TEAMS_SSO_RESOURCE = ssConfig('Teams_Sso_Resource');

// Microsoft Graph scopes and endpoints
const GRAPH_SCOPES = ['profile', 'openid'];
const GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';
const GRAPH_PHOTO_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/photo/$value';

export const handleTrailingSlash = (url: string): string => {
  return url.endsWith('/') ? url : `${url}/`;
};

/**
 * Dedicated redirect URI for MSAL popup flows.
 * Points to a lightweight static page that does NOT load the SPA,
 * preventing the full app from rendering inside the popup window.
 */
export const POPUP_REDIRECT_URI = `${handleTrailingSlash(
  window.location.origin
)}auth-redirect.html`;

/**
 * Redirect URI used inside the Teams SDK authentication popup.
 * After Azure AD authenticates the user, it redirects here where
 * `handleRedirectPromise()` extracts the auth result and calls
 * `authentication.notifySuccess()` to close the popup.
 *
 * Must be registered as a SPA redirect URI in the Azure AD app registration.
 */
export const TEAMS_AUTH_REDIRECT_URI = `${handleTrailingSlash(
  window.location.origin
)}teams-auth-end.html`;

// Check if we're running in Teams
const isInTeams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const inTeamsParam = urlParams.get('inTeams') === 'true';
  const parentCheck = window.parent !== window;
  const userAgent = (() => {
    try {
      return navigator.userAgent ?? '';
    } catch {
      return '';
    }
  })();
  const userAgentTeams =
    /TeamsMobile/i.test(userAgent) ||
    /Microsoft Teams/i.test(userAgent) ||
    /Teams\/\d/i.test(userAgent);

  return inTeamsParam || parentCheck || userAgentTeams;
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
    storeAuthStateInCookie: true, // Helps in Teams iframe and third-party contexts
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
  redirectUri: POPUP_REDIRECT_URI,
  extraQueryParameters: {
    domain_hint: 'organizations', // Prioritize work/school accounts
  },
};

// Fallback login request when silent auth fails
export const interactiveLoginRequest: PopupRequest = {
  scopes: [...CUSTOM_SCOPES, ...GRAPH_SCOPES],
  prompt: 'select_account',
  redirectUri: POPUP_REDIRECT_URI,
  extraQueryParameters: {
    domain_hint: 'organizations',
  },
};

// Teams-specific login request for SSO scenarios
export const teamsLoginRequest: PopupRequest = {
  scopes: [...CUSTOM_SCOPES, ...GRAPH_SCOPES],
  redirectUri: POPUP_REDIRECT_URI,
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
  if (TEAMS_SSO_RESOURCE) {
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

export const getAuthConfigIssue = (): string | null => {
  const missing = missingSsConfigKeys();
  if (missing.length > 0) {
    return `This site is not configured: ss-config.js does not set ${missing.join(
      ', '
    )}.`;
  }
  return null;
};

export { isInTeams, msalConfig };
export default msalConfig;
