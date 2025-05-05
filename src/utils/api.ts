import axios from 'axios';
import { loginRequest } from '../app/msalConfig';
import { msalInstance } from '../main';

function getBaseUrl(): string {
  return import.meta.env.VITE_CHAT_API_URI || '';
}

export const API = axios.create({
  baseURL: getBaseUrl(),
});

API.interceptors.request.use(async (config) => {
  try {
    const account = msalInstance.getActiveAccount();
    if (!account) {
      throw new Error(
        'No active account! Verify a user has been signed in and setActiveAccount has been called.'
      );
    }

    const tokenResponse = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });

    config.headers?.set('Authorization', `Bearer ${tokenResponse.accessToken}`);

    return config;
  } catch (error) {
    console.error('[MSAL] Token acquisition failed:', error);
    return config;
  }
});

export default API;
