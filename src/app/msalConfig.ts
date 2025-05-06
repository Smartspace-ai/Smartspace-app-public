import { Configuration, PopupRequest } from '@azure/msal-browser';

// Environment variables (provided via Vite)
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const AUTHORITY = import.meta.env.VITE_CLIENT_AUTHORITY; // e.g. https://login.microsoftonline.com/your-tenant-id
const CHAT_API_URI = import.meta.env.VITE_CHAT_API_URI;
const CUSTOM_SCOPES = import.meta.env.VITE_CLIENT_SCOPES.split(','); // e.g. "api://your-client-id/.default"

// Microsoft Graph scopes and endpoints
const GRAPH_SCOPES = ['User.Read', 'User.ReadBasic.All'];
const GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';
const GRAPH_PHOTO_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/photo/$value';

const handleTrailingSlash = (url: string): string => {
  return url.endsWith('/') ? url : `${url}/`;
};

// MSAL configuration object
const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: AUTHORITY,
    redirectUri: handleTrailingSlash(window.location.origin),
    postLogoutRedirectUri: handleTrailingSlash(window.location.origin),
  },
  cache: {
    cacheLocation: 'localStorage', // Persists auth state across tabs/sessions
    storeAuthStateInCookie: false, // Recommended false unless supporting legacy browsers
  },
  system: {
    allowNativeBroker: false, // Only relevant for native/mobile clients
  },
};

// Token request configurations
export const loginRequest: PopupRequest = {
  scopes: [...CUSTOM_SCOPES, ...GRAPH_SCOPES],
};

export const graphLoginRequest: PopupRequest = {
  scopes: GRAPH_SCOPES,
};

export const apiLoginRequest: PopupRequest = {
  scopes: CUSTOM_SCOPES,
};

// API endpoints used across the app
export const apiConfig = {
  chatApiUri: CHAT_API_URI,
};

export const graphConfig = {
  graphMeEndpoint: GRAPH_ME_ENDPOINT,
  graphPhotoEndpoint: GRAPH_PHOTO_ENDPOINT,
};

export default msalConfig;
