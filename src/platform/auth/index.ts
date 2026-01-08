import { isInTeams } from '@/platform/auth/msalConfig';
import { ssInfo } from '@/platform/log';

import { createMsalWebAdapter } from './providers/msalWeb';
import { createTeamsNaaAdapter } from './providers/teamsNaa';
import { getAuthRuntimeState } from './runtime';
import type { AuthAdapter } from './types';

export function createAuthAdapter(): AuthAdapter {
  // Prefer runtime state (set by TeamsProvider) when available, otherwise fall back to URL/parent detection.
  const runtime = getAuthRuntimeState();
  const inTeams = runtime.isInTeams === true || isInTeams();

  ssInfo('auth', `createAuthAdapter -> ${inTeams ? 'teams' : 'web'}`, {
    inTeams_msalConfig: (() => { try { return isInTeams(); } catch { return null; } })(),
    inTeams_runtime: runtime.isInTeams,
    origin: (() => { try { return window.location.origin; } catch { return null; } })(),
  });

  return inTeams ? createTeamsNaaAdapter() : createMsalWebAdapter();
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

