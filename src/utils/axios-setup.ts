import axios from 'axios';
import { msalInstance } from '../main';

function getBaseUrl() {
  const configBaseUrl =
    (window as any)?.ssconfig?.Chat_Api_Uri ||
    import.meta.env.VITE_CHAT_API_URI;
  const baseUrl = configBaseUrl;
  return baseUrl ? baseUrl : '';
}

const webApi = axios.create({
  baseURL: getBaseUrl(),
});

webApi.interceptors.request.use(async (config) => {
  const scopes = (
    (window as any)?.ssconfig?.Client_Scopes ||
    import.meta.env.VITE_CLIENT_SCOPES ||
    ''
  )
    .split(' ')
    .filter(
      (scope: string) => scope.indexOf('smartspaceapi.config.access') === -1
    );
  const request = {
    scopes: scopes,
  };
  try {
    const response = await msalInstance.acquireTokenSilent(request);
    config.headers.Authorization = `Bearer ${response.accessToken}`;
  } catch (error) {
    console.error('Error getting msal token:' + error);
  }

  return config;
});

export default webApi;
