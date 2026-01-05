import { Configuration, PopupRequest } from '@azure/msal-browser';
import { isInTeams } from '@/platform/auth/utils';

// Environment variables (provided via Vite)
// In production static hosting, we also support runtime configuration via `window.ssconfig`
// (see `Smartspace-app/docker/static-site-upload.sh` which emits Client_Id/Client_Authority/etc).
const runtimeCfg = (() => {
  try { return (window as any)?.ssconfig as Record<string, unknown> | undefined; } catch { return undefined; }
})();

const CLIENT_ID =
  (runtimeCfg?.Client_Id as string | undefined) ??
  (import.meta.env.VITE_CLIENT_ID as string | undefined);

const AUTHORITY =
  (runtimeCfg?.Client_Authority as string | undefined) ??
  (import.meta.env.VITE_CLIENT_AUTHORITY as string | undefined);

const CHAT_API_URI =
  (runtimeCfg?.Chat_Api_Uri as string | undefined) ??
  (import.meta.env.VITE_CHAT_API_URI as string | undefined);

const scopesRaw =
  (runtimeCfg?.Client_Scopes as string | undefined) ??
  (import.meta.env.VITE_CLIENT_SCOPES as string | undefined);

const CUSTOM_SCOPES = String(scopesRaw ?? '').split(/[ ,]+/).map(s => s.trim()).filter(Boolean);
const TEAMS_SSO_RESOURCE = import.meta.env.VITE_TEAMS_SSO_RESOURCE;

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
    // Provide safe defaults so MSAL doesn't crash with `endsWith` on undefined.
    // If these are wrong, interactive login will still fail with a readable MSAL error.
    clientId: (typeof CLIENT_ID === 'string' && CLIENT_ID.length) ? CLIENT_ID : '',
    authority:
      (typeof AUTHORITY === 'string' && AUTHORITY.length)
        ? AUTHORITY
        : 'https://login.microsoftonline.com/organizations',
    // IMPORTANT: For Entra ID SPA redirect URIs, an extra trailing slash often causes
    // `AADSTS50011: The reply URL specified in the request does not match...` in prod.
    // Use the exact origin (no forced slash) and register that origin in the app registration.
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
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
