// src/platform/auth/config.ts
//
// Single source of truth for auth-related runtime/env configuration.
// This prevents subtle mismatches where some code uses Vite env while other code uses window.ssconfig.
import { parseScopes } from './utils';

export type SsRuntimeConfig = {
  Client_Id?: unknown;
  Client_Authority?: unknown;
  Client_Scopes?: unknown;
  Client_RedirectUri?: unknown;
  Teams_Sso_Resource?: unknown;
  Chat_Api_Uri?: unknown;
};

const readRuntime = (): SsRuntimeConfig => {
  try {
    return ((window as any)?.ssconfig ?? {}) as SsRuntimeConfig;
  } catch {
    return {};
  }
};

export function getClientId(): string {
  const runtime = readRuntime();
  const fromRuntime = runtime?.Client_Id;
  const fromEnv = (import.meta as any)?.env?.VITE_CLIENT_ID;
  const val = (typeof fromRuntime === 'string' && fromRuntime.length)
    ? fromRuntime
    : (typeof fromEnv === 'string' && fromEnv.length)
      ? fromEnv
      : '';
  return val;
}

export function getAuthority(): string {
  const runtime = readRuntime();
  const fromRuntime = runtime?.Client_Authority;
  const fromEnv = (import.meta as any)?.env?.VITE_CLIENT_AUTHORITY;
  const val = (typeof fromRuntime === 'string' && fromRuntime.length)
    ? fromRuntime
    : (typeof fromEnv === 'string' && fromEnv.length)
      ? fromEnv
      : 'https://login.microsoftonline.com/organizations';
  return val;
}

/** Default redirect URI for SPA auth flows; must match an AAD "Redirect URI" exactly. */
export function getRedirectUri(): string {
  const runtime = readRuntime();
  const fromRuntime = runtime?.Client_RedirectUri;
  const fromEnv = (import.meta as any)?.env?.VITE_CLIENT_REDIRECT_URI;
  const val = (typeof fromRuntime === 'string' && fromRuntime.length)
    ? fromRuntime
    : (typeof fromEnv === 'string' && fromEnv.length)
      ? fromEnv
      : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  return val;
}

/** Default scopes used for API token acquisition across the app. */
export function getDefaultScopes(): string[] {
  const runtime = readRuntime();
  const raw = runtime?.Client_Scopes ?? (import.meta as any)?.env?.VITE_CLIENT_SCOPES;
  return parseScopes(raw);
}

/** Some deployments include a config-only scope; keep a helper to filter it consistently. */
export function getApiScopes(): string[] {
  return getDefaultScopes().filter((s) => !String(s).includes('smartspaceapi.config.access'));
}

export function getTeamsSsoResource(): string | undefined {
  const runtime = readRuntime();
  const raw = runtime?.Teams_Sso_Resource ?? (import.meta as any)?.env?.VITE_TEAMS_SSO_RESOURCE;
  return (typeof raw === 'string' && raw.length) ? raw : undefined;
}


