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
  return `${r.isInTeams}-${
    r.isGuestUser
  }-${force}-${getStoredUseMsalInTeams()}`;
}

/**
 * Returns a singleton AuthAdapter cached by runtime state fingerprint.
 * When Teams detection or guest status changes, the cached adapter is replaced.
 */
export function getAuthAdapter(): AuthAdapter {
  const key = adapterKey();
  if (cached?.key === key) return cached.adapter;

  const runtime = getAuthRuntimeState();
  const forceMsalInTeams = import.meta.env.VITE_TEAMS_USE_MSAL === 'true';
  const inTeams = runtime.isInTeams === true || isInTeams();
  const isGuest = runtime.isGuestUser === true;
  const storedUseMsal = getStoredUseMsalInTeams();

  const useMsalInTeams = forceMsalInTeams || isGuest || storedUseMsal === true;
  const useTeamsNaa = inTeams && !useMsalInTeams;

  ssInfoAlways(
    'auth',
    `getAuthAdapter -> ${useTeamsNaa ? 'teams-naa' : 'web/msal'}`,
    {
      inTeams,
      forceMsalInTeams,
      isGuest,
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
