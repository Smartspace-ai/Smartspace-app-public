import { Configuration, PopupRequest } from '@azure/msal-browser';

import { getClientScopesRaw, parseScopes } from '@/platform/auth/scopes';

type SsConfig = {
  Client_Id?: unknown;
  Client_Authority?: unknown;
  Tenant_Id?: unknown;
  Client_Scopes?: unknown;
  Chat_Api_Uri?: unknown;
  Teams_Sso_Resource?: unknown;
};

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getSsConfig(): SsConfig | null {
  try {
    const w = window as unknown as Window & { ssconfig?: SsConfig };
    return w?.ssconfig ?? null;
  } catch {
    return null;
  }
}

function readSsConfigKey(key: keyof SsConfig): string | null {
  const cfg = getSsConfig();
  if (!cfg) return null;
  return cleanString(cfg[key]);
}

// Environment variables (provided via Vite) with runtime config fallback (window.ssconfig)
const CLIENT_ID =
  readSsConfigKey('Client_Id') ?? import.meta.env.VITE_CLIENT_ID;
const TENANT_ID =
  readSsConfigKey('Tenant_Id') ?? import.meta.env.VITE_TENANT_ID;
const AUTHORITY =
  readSsConfigKey('Client_Authority') ??
  import.meta.env.VITE_CLIENT_AUTHORITY ??
  (TENANT_ID ? `https://login.microsoftonline.com/${TENANT_ID}` : undefined);
const CHAT_API_URI =
  readSsConfigKey('Chat_Api_Uri') ?? import.meta.env.VITE_CHAT_API_URI;
const CUSTOM_SCOPES = parseScopes(getClientScopesRaw());
const TEAMS_SSO_RESOURCE =
  readSsConfigKey('Teams_Sso_Resource') ??
  import.meta.env.VITE_TEAMS_SSO_RESOURCE;

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

export const getAuthConfigIssue = (): string | null => {
  if (!CLIENT_ID) {
    return 'Missing auth configuration: Client ID (set VITE_CLIENT_ID or window.ssconfig.Client_Id).';
  }
  if (!AUTHORITY) {
    return 'Missing auth configuration: Authority or Tenant ID (set VITE_CLIENT_AUTHORITY/VITE_TENANT_ID or window.ssconfig.Client_Authority/Tenant_Id).';
  }
  return null;
};

export { isInTeams, msalConfig };
export default msalConfig;
