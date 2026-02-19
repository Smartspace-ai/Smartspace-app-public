import { isInTeams } from '@/platform/auth/msalConfig';
import { ssInfoAlways } from '@/platform/log';

import { createMsalWebAdapter } from './providers/msalWeb';
import { createTeamsNaaAdapter } from './providers/teamsNaa';
import { getAuthRuntimeState, getStoredUseMsalInTeams } from './runtime';
import type { AuthAdapter } from './types';

export function createAuthAdapter(): AuthAdapter {
  const runtime = getAuthRuntimeState();
  const forceMsalInTeams = import.meta.env.VITE_TEAMS_USE_MSAL === 'true';
  const inTeams = runtime.isInTeams === true || isInTeams();
  const isGuest = runtime.isGuestUser === true;
  const storedUseMsal = getStoredUseMsalInTeams();

  const useMsalInTeams = forceMsalInTeams || isGuest || storedUseMsal === true;
  const useTeamsNaa = inTeams && !useMsalInTeams;

  ssInfoAlways(
    'auth',
    `createAuthAdapter -> ${useTeamsNaa ? 'teams-naa' : 'web/msal'}`,
    {
      inTeams,
      forceMsalInTeams,
      isGuest,
      storedUseMsal,
    }
  );

  return useTeamsNaa ? createTeamsNaaAdapter() : createMsalWebAdapter();
}
export * from './msalClient';
export * from './naaClient';
export * from './providers/msalWeb';
export * from './providers/teamsNaa';
export * from './session';
export * from './runtime';
export * from './scopes';
export * from './errors';
export * from './types';
