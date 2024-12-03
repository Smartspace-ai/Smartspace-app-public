import { Configuration, PopupRequest } from '@azure/msal-browser';

const SCOPES = import.meta.env.VITE_CLIENT_SCOPES.split(',');
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const AUTHORITY = import.meta.env.VITE_CLIENT_AUTHORITY;
const CHAT_API_URI = import.meta.env.VITE_CHAT_API_URI;

// GRAPH API
const GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';
const GRAPH_PHOTO_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/photo/$value';

const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: AUTHORITY,
    redirectUri: '/',
    postLogoutRedirectUri: '/',
  },
  system: {
    allowNativeBroker: false, // Disables WAM Broker
  },
  cache: {
    cacheLocation: 'localStorage',
  },
};

export const loginRequest: PopupRequest = {
  scopes: [...SCOPES, 'User.Read'],
};

export const apiConfig = {
  chatApiUri: CHAT_API_URI,
};

export const graphConfig = {
  graphMeEndpoint: GRAPH_ME_ENDPOINT,
  graphPhotoEndpoint: GRAPH_PHOTO_ENDPOINT,
};

export default msalConfig;
