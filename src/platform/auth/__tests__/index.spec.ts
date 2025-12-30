import { describe, expect, it, vi } from 'vitest';

import { createAuthAdapter } from '@/platform/auth';
import { isInTeams } from '@/platform/auth/utils';

vi.mock('@/platform/auth/providers/msalWeb', () => ({ createMsalWebAdapter: () => ({ kind: 'web' }) }));
vi.mock('@/platform/auth/providers/teamsNaa', () => ({ createTeamsNaaAdapter: () => ({ kind: 'teams' }) }));
vi.mock('@/platform/auth/utils', () => ({ isInTeams: vi.fn(() => false) }));

describe('auth index', () => {
  it('createAuthAdapter picks msal web by default', () => {
    (isInTeams as any).mockReturnValue(false);
    expect((createAuthAdapter('web') as any).kind).toBe('web');
  });
  it('createAuthAdapter picks teams when inTeams', () => {
    (isInTeams as any).mockReturnValue(true);
    expect((createAuthAdapter('auto') as any).kind).toBe('teams');
  });
});


