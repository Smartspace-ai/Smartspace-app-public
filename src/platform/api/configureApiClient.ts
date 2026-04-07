import { AXIOS_INSTANCE } from '@smartspace/api-client';
import { AxiosHeaders } from 'axios';

import { AuthRequiredError } from '@/platform/auth/errors';
import { getAuthAdapter } from '@/platform/auth/index';
import { isInTeams } from '@/platform/auth/msalConfig';
import {
  getAuthRuntimeState,
  setRuntimeAuthError,
} from '@/platform/auth/runtime';
import { getApiScopes } from '@/platform/auth/scopes';
import { SESSION_QUERY_KEY } from '@/platform/auth/sessionQuery';
import { ssInfo, ssWarn } from '@/platform/log';
import { queryClient } from '@/platform/reactQueryClient';

type SsConfig = {
  Chat_Api_Uri?: unknown;
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
  const configBaseUrl =
    w?.ssconfig?.Chat_Api_Uri ?? import.meta.env.VITE_CHAT_API_URI;
  return configBaseUrl ? configBaseUrl : '';
}

/**
 * Configure the shared API-client package's axios instance with
 * base URL, primitive-body serialisation, and auth interceptor.
 *
 * Call once at app startup, before any API calls are made.
 */
export function configureApiClient() {
  AXIOS_INSTANCE.defaults.baseURL = getBaseUrl();

  // Axios only auto-stringifies objects for application/json. Orval generates
  // application/*+json for some endpoints, so primitive body values (boolean,
  // number) slip through un-serialised. Stringify them explicitly.
  AXIOS_INSTANCE.interceptors.request.use((config) => {
    if (
      config.data !== undefined &&
      config.data !== null &&
      typeof config.data !== 'object' &&
      typeof config.data !== 'string'
    ) {
      config.data = JSON.stringify(config.data);
    }
    return config;
  });

  // Auth interceptor — attach Bearer token silently on every request.
  AXIOS_INSTANCE.interceptors.request.use(async (config) => {
    // Avoid triggering MSAL flows while on the login screen
    try {
      const path = window.location?.pathname || '';
      if (path.startsWith('/login')) {
        return config;
      }
    } catch {
      // ignore
    }

    // Prefer runtime store (set by TeamsProvider) when available.
    const runtime = getAuthRuntimeState();
    const inTeamsEnvironment = runtime.isInTeams === true || isInTeams();

    ssInfo('api', `request -> ${inTeamsEnvironment ? 'teams' : 'web'}`, {
      method: (config.method ?? 'get').toUpperCase(),
      url: config.url ?? null,
      baseURL: config.baseURL ?? null,
    });

    // Unified auth strategy:
    // - Always attach auth headers via the singleton AuthAdapter
    // - Never trigger interactive auth in the API layer (silentOnly only)
    const auth = getAuthAdapter();
    const scopes = getApiScopes();
    try {
      const token = await auth.getAccessToken({ silentOnly: true, scopes });
      const headers = AxiosHeaders.from(config.headers);
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
      setRuntimeAuthError(null);
    } catch (e) {
      // Record diagnostic signal for UI troubleshooting (Teams login screen reads this)
      setRuntimeAuthError({
        source: 'api',
        message: String(e instanceof Error ? e.message : e),
      });
      // Invalidate session query so UI reacts to auth failure
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });

      ssWarn('api', 'silent token attach failed (blocking request)', e);
      throw e instanceof AuthRequiredError ? e : new AuthRequiredError();
    }

    return config;
  });
}
