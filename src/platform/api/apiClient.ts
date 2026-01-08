import axios from 'axios';

import { createAuthAdapter } from '@/platform/auth';
import { AuthRequiredError } from '@/platform/auth/errors';
import { getApiScopes } from '@/platform/auth/scopes';
import { getAuthRuntimeState, setRuntimeAuthError } from '@/platform/auth/runtime';
import { isInTeams } from '@/platform/auth/msalConfig';
import { ssInfo, ssWarn } from '@/platform/log';

type SsConfig = {
  Chat_Api_Uri?: unknown;
  Client_Scopes?: unknown;
};

type SsWindow = Window & {
  ssconfig?: SsConfig;
};

function getSsWindow(): SsWindow | null {
  try {
    return window as unknown as SsWindow;
  } catch {
    return null;
  }
}

function getBaseUrl() {
  const w = getSsWindow();
  const configBaseUrl = w?.ssconfig?.Chat_Api_Uri ?? import.meta.env.VITE_CHAT_API_URI;
  return configBaseUrl ? configBaseUrl : '';
}

const baseURL = getBaseUrl();

const webApi = axios.create({
  baseURL,
});

webApi.interceptors.request.use(async (config) => {
  // Avoid triggering MSAL flows while on the login screen
  try {
    const path = window.location?.pathname || '';
    if (path.startsWith('/login')) {
      return config;
    }
  } catch {
    // ignore
  }

  // Prefer runtime store (set by TeamsProvider) when available. Avoid writing to `window.*` for auth state.
  const runtime = getAuthRuntimeState();
  const inTeamsEnvironment = runtime.isInTeams === true || isInTeams();

  ssInfo('api', `request -> ${inTeamsEnvironment ? 'teams' : 'web'}`, {
    method: (config.method ?? 'get').toUpperCase(),
    url: config.url ?? null,
    baseURL: config.baseURL ?? null,
  });

  // Unified auth strategy:
  // - Always attach auth headers via the AuthAdapter
  // - Never trigger interactive auth in the API layer (silentOnly only)
  const auth = createAuthAdapter();
  const scopes = getApiScopes();
  try {
    const token = await auth.getAccessToken({ silentOnly: true, scopes });
    if (!config.headers) config.headers = {};
    config.headers.Authorization = `Bearer ${token}`;
    setRuntimeAuthError(null);
  } catch (e) {
    // Record diagnostic signal for UI troubleshooting (Teams login screen reads this)
    setRuntimeAuthError({ source: 'api', message: String(e instanceof Error ? e.message : e) });

    ssWarn('api', 'silent token attach failed (blocking request)', e);
    throw (e instanceof AuthRequiredError ? e : new AuthRequiredError());
  }

  return config;
});

export { webApi as api };

