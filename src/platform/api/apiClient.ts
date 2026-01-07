import { msalInstance } from '@/platform/auth/msalClient';
import { interactiveLoginRequest, isInTeams } from '@/platform/auth/msalConfig';
import { acquireNaaToken } from '@/platform/auth/naaClient';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import axios from 'axios';
import { ssInfo, ssWarn } from '@/platform/log';

function getBaseUrl() {
  const configBaseUrl =
    (window as any)?.ssconfig?.Chat_Api_Uri ||
    import.meta.env.VITE_CHAT_API_URI;
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

  const inTeamsEnvironment =
    ((window as any)?.__teamsState?.isInTeams === true) || isInTeams();

  ssInfo('api', `request -> ${inTeamsEnvironment ? 'teams' : 'web'}`, {
    method: (config.method ?? 'get').toUpperCase(),
    url: config.url ?? null,
    baseURL: config.baseURL ?? null,
  });

  // Teams: use NAA to get delegated API token (no fallback)
  if (inTeamsEnvironment) {
    try {
      const raw = (window as any)?.ssconfig?.Client_Scopes ?? import.meta.env.VITE_CLIENT_SCOPES ?? '';
      const scopes = String(raw)
        .split(/[ ,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      ssInfo('api', 'Teams token via NAA (no token logged)', { scopesCount: scopes.length, scopes });
      const token = await acquireNaaToken(scopes);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      ssWarn('api', 'Teams NAA token attach failed (request will be unauthenticated)', e);
      // Leave request unauthenticated on failure
    }
    return config;
  }

  // Web (non-Teams): use MSAL
  const rawScopes = (window as any)?.ssconfig?.Client_Scopes ?? import.meta.env.VITE_CLIENT_SCOPES ?? '';
  const scopes = String(rawScopes)
    .split(/[ ,]+/)
    .map((s) => s.trim())
    .filter((s) => s && !s.includes('smartspaceapi.config.access'));

  const request = { scopes };

  try {
    const response = await msalInstance.acquireTokenSilent(request);

    // ✅ safer way of accessing token
    const accessToken =
      (response && 'accessToken' in response && response.accessToken) || null;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      ssWarn('api', 'MSAL silent token requires interaction; attempting loginRedirect', error);
      try {
        await msalInstance.loginRedirect(interactiveLoginRequest);
      } catch {
        // ignore
      }
    } else {
      ssWarn('api', 'MSAL acquireTokenSilent failed (request may be unauthenticated)', error);
    }
  }

  return config;
});

export { webApi as api };

