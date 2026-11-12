import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/platform/auth/providers/msalWeb', () => ({
  createMsalWebAdapter: () => ({ kind: 'msal' }),
}));

vi.mock('@/platform/auth/providers/teamsNaa', () => ({
  createTeamsNaaAdapter: () => ({ kind: 'naa' }),
}));

import { getAuthAdapter } from '@/platform/auth/index';
import { setRuntimeIsInTeams } from '@/platform/auth/runtime';

const win = window as unknown as { ssconfig?: Record<string, unknown> };

describe('getAuthAdapter inside Teams', () => {
  beforeEach(() => {
    setRuntimeIsInTeams(true);
  });

  afterEach(() => {
    delete win.ssconfig;
    localStorage.clear();
  });

  it("uses MSAL when ss-config.js sets Teams_Use_Msal to 'true'", () => {
    win.ssconfig = { Teams_Use_Msal: 'true' };

    expect(getAuthAdapter()).toEqual({ kind: 'msal' });
  });

  it("uses NAA when it is 'false', even after an earlier MSAL sign-in was remembered", () => {
    localStorage.setItem('ss_teams_use_msal', '1');
    win.ssconfig = { Teams_Use_Msal: 'false' };

    expect(getAuthAdapter()).toEqual({ kind: 'naa' });
  });
});
