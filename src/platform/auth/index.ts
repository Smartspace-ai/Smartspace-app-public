import { isInTeams } from '@/platform/auth/msalConfig';
import { createMsalWebAdapter } from './providers/msalWeb';
import { createTeamsNaaAdapter } from './providers/teamsNaa';
import type { AuthAdapter } from './types';

export function createAuthAdapter(): AuthAdapter {
  return isInTeams() ? createTeamsNaaAdapter() : createMsalWebAdapter();
}
export * from './msalClient';
export * from './naaClient';
export * from './providers/msalWeb';
export * from './providers/teamsNaa';
export * from './session';
export * from './types';

