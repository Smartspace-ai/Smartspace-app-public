// src/platform/transport.ts
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import axios, { AxiosHeaders } from 'axios';

import { msalInstance } from '@/platform/auth/msalClient';
import { interactiveLoginRequest } from '@/platform/auth/msalConfig';
import { acquireNaaToken } from '@/platform/auth/naaClient';
import { isInTeams, parseScopes } from '@/platform/auth/utils';

export const transport = axios.create({ baseURL: (() => {
  const cfg = (window as any)?.ssconfig?.Chat_Api_Uri ?? import.meta.env.VITE_CHAT_API_URI;
  return typeof cfg === 'string' && cfg.length ? cfg : '';
})() });

transport.interceptors.request.use(async (config) => {
  const headers = config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers);

  const path = window?.location?.pathname ?? '';
  if (path.startsWith('/login')) { config.headers = headers; return config; }

  if (isInTeams()) {
    try {
      const raw = (window as any)?.ssconfig?.Client_Scopes ?? import.meta.env.VITE_CLIENT_SCOPES;
      const scopes = parseScopes(raw);
      const token = await acquireNaaToken(scopes);
      if (token) headers.set('Authorization', `Bearer ${token}`);
    } catch {
      // leave unauthenticated; API should 401
    }
    config.headers = headers;
    return config;
  }

  try {
    const raw = (window as any)?.ssconfig?.Client_Scopes ?? import.meta.env.VITE_CLIENT_SCOPES;
    const scopes = parseScopes(raw).filter(s => !s.includes('smartspaceapi.config.access'));
    const res = await msalInstance.acquireTokenSilent({ scopes });
    const accessToken = (res && 'accessToken' in res && res.accessToken) || null;
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      try { await msalInstance.loginRedirect(interactiveLoginRequest); } catch {
        // no login dialog; no auth handled in the app
      }
    }
  }

  config.headers = headers;
  return config;
});
