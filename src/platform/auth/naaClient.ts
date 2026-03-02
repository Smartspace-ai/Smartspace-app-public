import {
  createNestablePublicClientApplication,
  InteractionRequiredAuthError,
  type Configuration,
  type IPublicClientApplication,
} from '@azure/msal-browser';
import { app as teamsApp } from '@microsoft/teams-js';

import { ssInfo, ssWarn } from '@/platform/log';

type SsConfig = {
  Client_Id?: unknown;
  Tenant_Id?: unknown;
};

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getSsConfig(): SsConfig | null {
  try {
    const w = window as unknown as Window & { ssconfig?: SsConfig };
    return w?.ssconfig ?? null;
  } catch {
    return null;
  }
}

let pcaPromise: Promise<IPublicClientApplication> | null = null;

export const naaInit = () => {
  if (!pcaPromise) {
    pcaPromise = (async () => {
      try {
        await teamsApp.initialize();
        ssInfo('auth:naa', 'Teams SDK initialized for NAA');
      } catch (error) {
        ssWarn(
          'auth:naa',
          'Teams SDK initialization failed for NAA (continuing)',
          error
        );
        // Continue anyway, might work with existing initialization
      }
      const cfg = getSsConfig();
      const clientId =
        cleanString(cfg?.Client_Id) ??
        (import.meta.env.VITE_CLIENT_ID as string | undefined);
      const tenantId =
        cleanString(cfg?.Tenant_Id) ??
        (import.meta.env.VITE_TENANT_ID as string | undefined);
      if (!clientId || !tenantId) {
        throw new Error(
          'Missing auth configuration for NAA (Client_Id/Tenant_Id).'
        );
      }
      const authority = `https://login.microsoftonline.com/${tenantId}`;
      const config: Configuration = {
        auth: {
          clientId,
          authority,
          navigateToLoginRequestUrl: false,
          supportsNestedAppAuth: true,
        },
        system: { allowNativeBroker: false },
        cache: { cacheLocation: 'localStorage' },
      };
      return createNestablePublicClientApplication(config);
    })();
  }
  return pcaPromise;
};

const tokenCache: Record<string, { token: string; exp: number }> = {};
const TOKEN_CACHE_KEY = 'smartspace.naa.tokenCache';
let tokenCacheHydrated = false;

const pruneExpiredCache = () => {
  Object.keys(tokenCache).forEach((key) => {
    if (isExpired(tokenCache[key].exp)) {
      delete tokenCache[key];
    }
  });
};

const hydrateTokenCache = () => {
  if (tokenCacheHydrated) return;
  tokenCacheHydrated = true;
  try {
    const raw = localStorage.getItem(TOKEN_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<
      string,
      { token: string; exp: number }
    >;
    Object.entries(parsed).forEach(([key, value]) => {
      if (
        !value ||
        typeof value.token !== 'string' ||
        typeof value.exp !== 'number'
      ) {
        return;
      }
      if (!isExpired(value.exp)) {
        tokenCache[key] = { token: value.token, exp: value.exp };
      }
    });
    pruneExpiredCache();
  } catch {
    // Ignore localStorage or JSON failures
  }
};

const persistTokenCache = () => {
  try {
    pruneExpiredCache();
    localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(tokenCache));
  } catch {
    // Ignore localStorage failures (private mode / storage full)
  }
};

const getCachedToken = (key: string) => {
  hydrateTokenCache();
  const cached = tokenCache[key];
  if (!cached) return null;
  if (isExpired(cached.exp)) {
    delete tokenCache[key];
    persistTokenCache();
    return null;
  }
  return cached.token;
};

const setCachedToken = (key: string, token: string, exp: number) => {
  tokenCache[key] = { token, exp };
  persistTokenCache();
};
const isExpired = (exp: number, skew = 60) =>
  Math.floor(Date.now() / 1000) + skew >= exp;

export type AcquireNaaTokenOptions = { silentOnly?: boolean };

export const acquireNaaToken = async (
  scopes: string[],
  opts?: AcquireNaaTokenOptions
): Promise<string> => {
  ssInfo('auth:naa', 'acquireNaaToken start', {
    scopesCount: scopes.length,
    silentOnly: !!opts?.silentOnly,
  });
  const key = scopes.sort().join(' ');
  const cachedToken = getCachedToken(key);
  if (cachedToken) return cachedToken;

  const pca = await naaInit();
  const accounts = pca.getAllAccounts();
  const account = accounts[0];

  try {
    if (!account) {
      ssWarn('auth:naa', 'No account found for NAA token acquisition');
      throw new InteractionRequiredAuthError('No account available');
    }

    ssInfo('auth:naa', 'Attempting silent token acquisition');
    const res = await pca.acquireTokenSilent({ account, scopes });
    const token = res.accessToken;
    const exp = JSON.parse(atob(token.split('.')[1])).exp as number | undefined;
    setCachedToken(key, token, exp ?? Math.floor(Date.now() / 1000) + 900);
    ssInfo('auth:naa', 'Silent token acquisition successful');
    return token;
  } catch (error) {
    if (opts?.silentOnly) throw error;
    ssWarn('auth:naa', 'Silent token acquisition failed, trying popup', error);
    try {
      const res = await pca.acquireTokenPopup({ scopes });
      const token = res.accessToken;
      const exp = JSON.parse(atob(token.split('.')[1])).exp as
        | number
        | undefined;
      setCachedToken(key, token, exp ?? Math.floor(Date.now() / 1000) + 900);
      ssInfo('auth:naa', 'Popup token acquisition successful');
      return token;
    } catch (popupError) {
      ssWarn(
        'auth:naa',
        'Both silent and popup token acquisition failed',
        popupError
      );
      throw popupError;
    }
  }
};
