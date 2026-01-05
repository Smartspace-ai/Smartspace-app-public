// src/platform/transport.ts
import axios, { AxiosHeaders } from 'axios';

import { createAuthAdapter } from '@/platform/auth';
import { parseScopes } from '@/platform/auth/utils';

export const transport = axios.create({ baseURL: (() => {
  const cfg = (window as any)?.ssconfig?.Chat_Api_Uri ?? import.meta.env.VITE_CHAT_API_URI;
  return typeof cfg === 'string' && cfg.length ? cfg : '';
})() });

transport.interceptors.request.use(async (config) => {
  const headers = config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers);

  const path = window?.location?.pathname ?? '';
  if (path.startsWith('/login')) { config.headers = headers; return config; }

  // IMPORTANT: keep interceptors side-effect-free (no redirects/popup).
  // If we can't get a token silently, let the request proceed; the API can 401 and
  // TanStack route guards drive interactive sign-in at navigation boundaries.
  try {
    const raw = (window as any)?.ssconfig?.Client_Scopes ?? import.meta.env.VITE_CLIENT_SCOPES;
    const scopes = parseScopes(raw).filter((s) => !s.includes('smartspaceapi.config.access'));
    const auth = createAuthAdapter();
    const token = await auth.getAccessToken({ scopes, silentOnly: true });
    if (token) headers.set('Authorization', `Bearer ${token}`);
  } catch {
    // leave unauthenticated; API should 401
  }

  config.headers = headers;
  return config;
});
