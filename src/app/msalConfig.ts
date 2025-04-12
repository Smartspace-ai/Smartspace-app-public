import { Configuration, PopupRequest } from '@azure/msal-browser';

// 🌐 Environment Variables (via Vite)
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const AUTHORITY = import.meta.env.VITE_CLIENT_AUTHORITY; // e.g. https://login.microsoftonline.com/your-tenant-id
const CHAT_API_URI = import.meta.env.VITE_CHAT_API_URI;
const CUSTOM_SCOPES = import.meta.env.VITE_CLIENT_SCOPES.split(','); // e.g. "api://your-client-id/.default"

// 📎 Microsoft Graph Scopes
const GRAPH_SCOPES = ['User.Read', 'User.ReadBasic.All'];
const GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';
const GRAPH_PHOTO_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/photo/$value';

// ⚙️ MSAL Configuration
const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: AUTHORITY,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage', // Persist across tabs
    storeAuthStateInCookie: false, // Optional fallback for IE/Safari
  },
  system: {
    allowNativeBroker: false, // For native mobile apps; keep false for web
  },
};

// ✅ Token requests (used in login + token acquisition)
export const loginRequest: PopupRequest = {
  scopes: [...CUSTOM_SCOPES, ...GRAPH_SCOPES],
};

export const graphLoginRequest: PopupRequest = {
  scopes: GRAPH_SCOPES,
};

export const apiLoginRequest: PopupRequest = {
  scopes: CUSTOM_SCOPES,
};

// 🔗 API Endpoint Config
export const apiConfig = {
  chatApiUri: CHAT_API_URI,
};

export const graphConfig = {
  graphMeEndpoint: GRAPH_ME_ENDPOINT,
  graphPhotoEndpoint: GRAPH_PHOTO_ENDPOINT,
};

export default msalConfig;
