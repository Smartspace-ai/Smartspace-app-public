import { isInTeams } from '@/platform/auth/msalConfig';
import { ssInfo } from '@/platform/log';

import { createMsalWebAdapter } from './providers/msalWeb';
import { createTeamsNaaAdapter } from './providers/teamsNaa';
import { getAuthRuntimeState, getStoredUseMsalInTeams } from './runtime';
import type { AuthAdapter } from './types';

export function createAuthAdapter(): AuthAdapter {
  const runtime = getAuthRuntimeState();
  const forceMsalInTeams = import.meta.env.VITE_TEAMS_USE_MSAL === 'true';
  const inTeams = runtime.isInTeams === true || isInTeams();
  const isGuest = runtime.isGuestUser === true;
  const isDesktop = runtime.isTeamsDesktop === true;
  const storedUseMsal = getStoredUseMsalInTeams();

  // NAA has known issues in Teams desktop (token 400); use MSAL there. Web can use NAA.
  // When isTeamsDesktop is null (context not yet loaded), default to MSAL to avoid desktop failures.
  const useMsalInTeams =
    forceMsalInTeams ||
    isGuest ||
    isDesktop ||
    (inTeams && runtime.isTeamsDesktop === null) ||
    storedUseMsal === true;
  const useTeamsNaa = inTeams && !useMsalInTeams;

  ssInfo(
    'auth',
    `createAuthAdapter -> ${useTeamsNaa ? 'teams-naa' : 'web/msal'}`,
    {
      inTeams,
      forceMsalInTeams,
      isGuest,
      isDesktop,
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
