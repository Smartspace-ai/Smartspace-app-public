import { createMsalWebAdapter } from './providers/msalWeb';
import { createTeamsNaaAdapter } from './providers/teamsNaa';
import type { AuthAdapter } from './types';
import { isInTeams } from './utils';

export type AdapterMode = 'auto' | 'web' | 'teams';

/** Factory for non-React usage; provider uses its own picker. */
export function createAuthAdapter(mode: AdapterMode = 'auto'): AuthAdapter {
  const pick =
    mode === 'teams' || (mode === 'auto' && isInTeams())
      ? createTeamsNaaAdapter
      : createMsalWebAdapter;
  const adapter = pick();
  try {
    (window as any).__authAdapterKind = pick === createTeamsNaaAdapter ? 'teams' : 'web';
  } catch {
    // ignore
  }
  return adapter;
}
