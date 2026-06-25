import { isInTeams } from '@/platform/auth/msalConfig';
import { ssInfoAlways } from '@/platform/log';

import { createMsalWebAdapter } from './providers/msalWeb';
import { createTeamsNaaAdapter } from './providers/teamsNaa';
import { getAuthRuntimeState, getStoredUseMsalInTeams } from './runtime';
import type { AuthAdapter } from './types';

let cached: { adapter: AuthAdapter; key: string } | null = null;

function adapterKey(): string {
  const r = getAuthRuntimeState();
  const env = String(import.meta.env.VITE_TEAMS_USE_MSAL);
  return `${r.isInTeams}-${env}-${getStoredUseMsalInTeams()}`;
}

/**
 * Returns a singleton AuthAdapter cached by runtime state fingerprint.
 * When Teams detection changes, the cached adapter is replaced.
 */
export function getAuthAdapter(): AuthAdapter {
  const key = adapterKey();
  if (cached?.key === key) return cached.adapter;

  const runtime = getAuthRuntimeState();
  // The env flag is authoritative: 'true' forces MSAL, 'false' forces NAA.
  // The `storedUseMsal` runtime escape-hatch only applies when the env flag is
  // unset — otherwise a stale flag from a prior MSAL success would stick and
  // override an explicit NAA configuration.
  const envMsal = import.meta.env.VITE_TEAMS_USE_MSAL;
  const forceMsalInTeams = envMsal === 'true';
  const forceNaaInTeams = envMsal === 'false';
  const inTeams = runtime.isInTeams === true || isInTeams();
  const storedUseMsal = getStoredUseMsalInTeams();

  const useMsalInTeams =
    forceMsalInTeams || (!forceNaaInTeams && storedUseMsal === true);
  const useTeamsNaa = inTeams && !useMsalInTeams;

  ssInfoAlways(
    'auth',
    `getAuthAdapter -> ${useTeamsNaa ? 'teams-naa' : 'web/msal'}`,
    {
      inTeams,
      forceMsalInTeams,
      forceNaaInTeams,
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
