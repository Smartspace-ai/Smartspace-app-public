import { Configuration, PopupRequest } from '@azure/msal-browser';

// Environment variables (provided via Vite)
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const AUTHORITY = import.meta.env.VITE_CLIENT_AUTHORITY; // e.g. https://login.microsoftonline.com/your-tenant-id
const CHAT_API_URI = import.meta.env.VITE_CHAT_API_URI;
const CUSTOM_SCOPES = import.meta.env.VITE_CLIENT_SCOPES?.split(',') || []; // e.g. "api://your-client-id/.default"

// Debug: Log environment configuration
console.log('=== AUTH DEBUG INFO ===');
console.log('Environment check:', {
  CLIENT_ID: CLIENT_ID || '❌ MISSING',
  AUTHORITY: AUTHORITY || '❌ MISSING',
  SCOPES: import.meta.env.VITE_CLIENT_SCOPES || '❌ MISSING',
  API_URI: CHAT_API_URI || '❌ MISSING'
});
console.log('Parsed CUSTOM_SCOPES:', CUSTOM_SCOPES);

// Microsoft Graph scopes and endpoints
const GRAPH_SCOPES = ['User.Read', 'User.ReadBasic.All'];
const GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';
const GRAPH_PHOTO_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/photo/$value';

const handleTrailingSlash = (url: string): string => {
  return url.endsWith('/') ? url : `${url}/`;
};

// Check if we're running in Teams
const isInTeams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const inTeamsParam = urlParams.get('inTeams') === 'true';
  const parentCheck = window.parent !== window;
  
  console.log('=== isInTeams() DEBUG ===');
  console.log('URL params check:', inTeamsParam);
  console.log('Parent window check:', parentCheck);
  console.log('Final result:', inTeamsParam || parentCheck);
  
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
    navigateToLoginRequestUrl: !isInTeams(),
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
  prompt: isInTeams() ? 'none' : 'select_account', // Silent auth in Teams when possible
};

export const graphLoginRequest: PopupRequest = {
  scopes: GRAPH_SCOPES,
  prompt: isInTeams() ? 'none' : 'select_account',
};

export const apiLoginRequest: PopupRequest = {
  scopes: CUSTOM_SCOPES,
  prompt: isInTeams() ? 'none' : 'select_account',
};

// Teams-specific login request for SSO scenarios
export const teamsLoginRequest: PopupRequest = {
  scopes: [...CUSTOM_SCOPES, ...GRAPH_SCOPES],
  prompt: 'none',
  extraQueryParameters: {
    domain_hint: 'organizations', // Hint for organizational accounts
  },
};

// API endpoints used across the app
export const apiConfig = {
  chatApiUri: CHAT_API_URI,
};

export const graphConfig = {
  graphMeEndpoint: GRAPH_ME_ENDPOINT,
  graphPhotoEndpoint: GRAPH_PHOTO_ENDPOINT,
};

export { isInTeams };
export default msalConfig;
