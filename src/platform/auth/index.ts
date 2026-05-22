import { isInTeams } from '@/platform/auth/msalConfig';
import { ssInfoAlways } from '@/platform/log';

import { createMsalWebAdapter } from './providers/msalWeb';
import { createTeamsNaaAdapter } from './providers/teamsNaa';
import { getAuthRuntimeState, getStoredUseMsalInTeams } from './runtime';
import type { AuthAdapter } from './types';

let cached: { adapter: AuthAdapter; key: string } | null = null;

function adapterKey(): string {
  const r = getAuthRuntimeState();
  const force = import.meta.env.VITE_TEAMS_USE_MSAL === 'true';
  return `${r.isInTeams}-${force}-${getStoredUseMsalInTeams()}`;
}

/**
 * Stub auth adapter used during Playwright browser integration tests.
 * Activated by VITE_E2E_AUTH_BYPASS=true — never set in production builds.
 * Returns a synthetic session and a fake bearer token so the /_protected
 * auth guard passes and axios attaches an Authorization header, while
 * MSW intercepts all downstream API calls.
 */
function createE2EAuthAdapter(): AuthAdapter {
  ssInfoAlways('auth', 'getAuthAdapter -> e2e-bypass (VITE_E2E_AUTH_BYPASS)');
  return {
    async getAccessToken() {
      return 'e2e-fake-bearer-token';
    },
    async getSession() {
      return { accountId: 'e2e-user-id', displayName: 'E2E Test User' };
    },
    async signIn() {
      // No-op in E2E
    },
    async signOut() {
      // No-op in E2E
    },
    getStoredRedirectUrl() {
      return null;
    },
  };
}

/**
 * Returns a singleton AuthAdapter cached by runtime state fingerprint.
 * When Teams detection changes, the cached adapter is replaced.
 */
export function getAuthAdapter(): AuthAdapter {
  // Short-circuit to stub adapter for Playwright browser integration tests.
  if (import.meta.env.VITE_E2E_AUTH_BYPASS === 'true') {
    if (cached?.key === 'e2e') return cached.adapter;
    const adapter = createE2EAuthAdapter();
    cached = { adapter, key: 'e2e' };
    return adapter;
  }

  const key = adapterKey();
  if (cached?.key === key) return cached.adapter;

  const runtime = getAuthRuntimeState();
  const forceMsalInTeams = import.meta.env.VITE_TEAMS_USE_MSAL === 'true';
  const inTeams = runtime.isInTeams === true || isInTeams();
  const storedUseMsal = getStoredUseMsalInTeams();

  const useMsalInTeams = forceMsalInTeams || storedUseMsal === true;
  const useTeamsNaa = inTeams && !useMsalInTeams;

  ssInfoAlways(
    'auth',
    `getAuthAdapter -> ${useTeamsNaa ? 'teams-naa' : 'web/msal'}`,
    {
      inTeams,
      forceMsalInTeams,
      storedUseMsal,
    }
  );

  const adapter = useTeamsNaa
    ? createTeamsNaaAdapter()
    : createMsalWebAdapter();
  cached = { adapter, key };
  return adapter;
}

/** @deprecated Use `getAuthAdapter()` instead. */
export const createAuthAdapter = getAuthAdapter;
export * from './msalClient';
export * from './naaClient';
export * from './providers/msalWeb';
export * from './providers/teamsNaa';
export * from './session';
export * from './runtime';
export * from './scopes';
export * from './errors';
export * from './sessionQuery';
export * from './types';
