// src/platform/auth/naaClient.ts
import {
  createNestablePublicClientApplication,
  InteractionRequiredAuthError,
  type Configuration,
  type IPublicClientApplication,
} from '@azure/msal-browser';
import { app as teamsApp } from '@microsoft/teams-js';

let pcaPromise: Promise<IPublicClientApplication> | null = null;

const NAA_ACTIVE_HOME_ACCOUNT_ID_KEY = 'naaActiveHomeAccountId';

function pickPreferredAccount(pca: IPublicClientApplication) {
  const current = pca.getActiveAccount();
  if (current) return current;
  const all = pca.getAllAccounts();
  if (all.length === 0) return null;

  let preferred = all[0];
  try {
    const saved = localStorage.getItem(NAA_ACTIVE_HOME_ACCOUNT_ID_KEY);
    if (saved) preferred = all.find(a => a.homeAccountId === saved) ?? preferred;
  } catch {
    // ignore storage failures
  }
  return preferred;
}

function setActiveAccount(pca: IPublicClientApplication, account: any) {
  if (!account) return;
  pca.setActiveAccount(account);
  try {
    const id = account?.homeAccountId;
    if (typeof id === 'string' && id.length) localStorage.setItem(NAA_ACTIVE_HOME_ACCOUNT_ID_KEY, id);
  } catch {
    // ignore storage failures
  }
}

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
          // Keep consistent with web MSAL config; important for SPA reply URLs.
          redirectUri: window.location.origin,
          navigateToLoginRequestUrl: false,
          supportsNestedAppAuth: true,
        },
        cache: { cacheLocation: 'localStorage' },
        system: { allowNativeBroker: false },
      };
      // Note: in msal-browser, this returns a Promise.
      const pca = await createNestablePublicClientApplication(config);

      // Ensure MSAL storage/caches are ready before reading accounts/tokens.
      try {
        await (pca as any).initialize?.();
      } catch {
        // ignore init failures; token acquisition will surface errors if any
      }

      // If any redirect-based flows happened, process them.
      try {
        const redirectResult = await (pca as any).handleRedirectPromise?.();
        const account = redirectResult?.account ?? pickPreferredAccount(pca);
        if (account) setActiveAccount(pca, account);
      } catch {
        // ignore redirect handling failures
      }

      // If we still have cached accounts, pick one deterministically.
      try {
        const account = pickPreferredAccount(pca);
        if (account) setActiveAccount(pca, account);
      } catch {
        // ignore
      }

      return pca;
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
type InternalAcquireOptions = AcquireNaaTokenOptions & { silentOnly?: boolean };

/** Acquire a Teams/NAA delegated token for the given scopes. */
export const acquireNaaToken = async (
  scopes: string[],
  opts?: InternalAcquireOptions
): Promise<string> => {
  const pca = await naaInit();

  // NAA accounts can appear slightly after init; retry briefly to avoid flakiness.
  let account: any = null;
  for (let attempt = 0; attempt < 3 && !account; attempt++) {
    account = pickPreferredAccount(pca);
    if (account) break;
    await new Promise((r) => setTimeout(r, 150 + attempt * 250));
  }
  if (account) setActiveAccount(pca, account);
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
  } catch (e) {
    // If the auth stack is throwing native fetch Responses (e.g. redirects),
    // surface a readable error and avoid looping into interactive prompts.
    if (typeof Response !== 'undefined' && e instanceof Response) {
      const location = (() => {
        try { return e.headers?.get('location') ?? ''; } catch { return ''; }
      })();
      throw new Error(
        `Teams auth request was redirected (status ${e.status})${location ? ` to ${location}` : ''}`
      );
    }

    // Respect silentOnly (used by route guard). Do not fall back to popup.
    if (opts?.silentOnly) throw e;

    // Silent failed; fall back to popup
    const res = await pca.acquireTokenPopup({ scopes });
    const token = res.accessToken;
    tokenCache.set(cacheKey, { token, exp: decodeExp(token) ?? nowSec() + 900 });
    return token;
  }
};

// Helpers (nice for tests/devtools)
export const clearNaaTokenCache = () => tokenCache.clear();
