import { isInTeams } from '@/platform/auth/msalConfig';
import { ssInfo } from '@/platform/log';

import { createMsalWebAdapter } from './providers/msalWeb';
import { createTeamsNaaAdapter } from './providers/teamsNaa';
import type { AuthAdapter } from './types';

export function createAuthAdapter(): AuthAdapter {
  // Check if we're in Teams with more robust detection
  const inTeams = isInTeams() || 
                  (typeof window !== 'undefined' && 
                   (window as any).__teamsState?.isInTeams === true);

  ssInfo('auth', `createAuthAdapter -> ${inTeams ? 'teams' : 'web'}`, {
    inTeams_msalConfig: (() => { try { return isInTeams(); } catch { return null; } })(),
    inTeams_state: (() => { try { return (window as any).__teamsState?.isInTeams ?? null; } catch { return null; } })(),
    origin: (() => { try { return window.location.origin; } catch { return null; } })(),
  });

  return inTeams ? createTeamsNaaAdapter() : createMsalWebAdapter();
}
export * from './msalClient';
export * from './naaClient';
export * from './providers/msalWeb';
export * from './providers/teamsNaa';
export * from './session';
export * from './types';

