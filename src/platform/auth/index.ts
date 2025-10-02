import { isInTeams } from '@/platform/auth/msalConfig';

import { createMsalWebAdapter } from './providers/msalWeb';
import { createTeamsNaaAdapter } from './providers/teamsNaa';
import type { AuthAdapter } from './types';

export function createAuthAdapter(): AuthAdapter {
  // Check if we're in Teams with more robust detection
  const inTeams = isInTeams() || 
                  (typeof window !== 'undefined' && 
                   (window as any).__teamsState?.isInTeams === true);
  
  return inTeams ? createTeamsNaaAdapter() : createMsalWebAdapter();
}
export * from './msalClient';
export * from './naaClient';
export * from './providers/msalWeb';
export * from './providers/teamsNaa';
export * from './session';
export * from './types';

