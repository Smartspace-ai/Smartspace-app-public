import { useMsal } from '@azure/msal-react';
import axios from 'axios';
import { loginRequest } from '../app/msalConfig';

/**
 *
 * @deprecated
 */
function getBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_Admin_Api_Uri;
  return baseUrl ? baseUrl : '';
}

export const API = axios.create({
  baseURL: getBaseUrl(),
});

axios.interceptors.request.use(async (config) => {
  try {
    const activeAccount = useMsal().instance.getActiveAccount();
    if (!activeAccount) {
      throw Error(
        'No active account! Verify a user has been signed in and setActiveAccount has been called.'
      );
    }
    const response = await useMsal().instance.acquireTokenSilent({
      ...loginRequest,
      account: activeAccount,
    });
    const bearer = `Bearer ${response.accessToken}`;
    config.headers.Authorization = bearer;

    if (config.url) {
      const url = new URL(config.url, getBaseUrl());
      if (!url.href.startsWith('https')) {
        config.baseURL = getBaseUrl();
      }
    }
    return config;
  } catch (error) {
    console.error('Error getting access token:', error);
    return config;
  }
});

export default API;
