// src/platform/auth/naaClient.ts
import {
  createNestablePublicClientApplication,
  InteractionRequiredAuthError,
  type Configuration,
  type IPublicClientApplication,
} from '@azure/msal-browser';
import { app as teamsApp } from '@microsoft/teams-js';

let pcaPromise: Promise<IPublicClientApplication> | null = null;

export const naaInit = () => {
  if (!pcaPromise) {
    pcaPromise = (async () => {
      try {
        await teamsApp.initialize();
      } catch {
        // ignore – app may already be initialized by host
      }
      const clientId = import.meta.env.VITE_CLIENT_ID as string;
      const authorityFromEnv = import.meta.env.VITE_CLIENT_AUTHORITY as string | undefined;
      const tenantId = import.meta.env.VITE_TENANT_ID as string | undefined;
      const authority =
        (typeof authorityFromEnv === 'string' && authorityFromEnv.length)
          ? authorityFromEnv
          : (typeof tenantId === 'string' && tenantId.length)
            ? `https://login.microsoftonline.com/${tenantId}`
            : 'https://login.microsoftonline.com/organizations';

      if (!clientId || typeof clientId !== 'string') {
        throw new Error('VITE_CLIENT_ID is required for Teams/NAA auth');
      }
      const config: Configuration = {
        auth: {
          clientId,
          authority,
          navigateToLoginRequestUrl: false,
          supportsNestedAppAuth: true,
        },
        cache: { cacheLocation: 'localStorage' },
        system: { allowNativeBroker: false },
      };
      return createNestablePublicClientApplication(config);
    })();
  }
  return pcaPromise;
};

type CacheEntry = { token: string; exp: number };
const tokenCache = new Map<string, CacheEntry>();

const nowSec = () => Math.floor(Date.now() / 1000);
const isExpired = (exp: number, skew = 60) => nowSec() + skew >= exp;
const decodeExp = (jwt: string): number | undefined => {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1] ?? ''));
    return typeof payload?.exp === 'number' ? payload.exp : undefined;
  } catch {
    return undefined;
  }
};

export type AcquireNaaTokenOptions = { forceRefresh?: boolean };

/** Acquire a Teams/NAA delegated token for the given scopes. */
export const acquireNaaToken = async (
  scopes: string[],
  opts?: AcquireNaaTokenOptions
): Promise<string> => {
  const pca = await naaInit();
  const account = pca.getActiveAccount() ?? pca.getAllAccounts()[0];
  if (!account) throw new InteractionRequiredAuthError('No account available');

  const scopeKey = [...scopes].sort().join(' ');
  const cacheKey = `${account.homeAccountId}::${scopeKey}`;

  if (!opts?.forceRefresh) {
    const cached = tokenCache.get(cacheKey);
    if (cached && !isExpired(cached.exp)) return cached.token;
  }

  try {
    const res = await pca.acquireTokenSilent({ account, scopes });
    const token = res.accessToken;
    tokenCache.set(cacheKey, { token, exp: decodeExp(token) ?? nowSec() + 900 });
    return token;
  } catch {
    // Silent failed; fall back to popup
    const res = await pca.acquireTokenPopup({ scopes });
    const token = res.accessToken;
    tokenCache.set(cacheKey, { token, exp: decodeExp(token) ?? nowSec() + 900 });
    return token;
  }
};

// Helpers (nice for tests/devtools)
export const clearNaaTokenCache = () => tokenCache.clear();
