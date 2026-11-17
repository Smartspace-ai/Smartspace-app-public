import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useColorScheme } from '@/theme/colorScheme';

import { TeamsProvider } from '../TeamsProvider';

const { teams } = vi.hoisted(() => ({
  teams: {
    theme: 'dark',
    onThemeChange: (_theme: string) => undefined as void,
  },
}));

vi.mock('@/platform/auth/msalConfig', async (orig) => ({
  ...((await orig()) as object),
  isInTeams: () => true,
}));

vi.mock('@microsoft/teams-js', () => ({
  app: {
    initialize: vi.fn(async () => undefined),
    getContext: vi.fn(async () => ({ app: { theme: teams.theme } })),
    registerOnThemeChangeHandler: vi.fn((handler: (t: string) => void) => {
      teams.onThemeChange = handler;
    }),
  },
}));

function ToggleProbe() {
  const { hostControlled } = useColorScheme();
  return <span>{hostControlled ? 'toggle hidden' : 'toggle shown'}</span>;
}

const isDark = () => document.documentElement.classList.contains('dark');

describe('TeamsProvider theme', () => {
  it('follows the Teams theme, maps contrast to dark, and never saves it', async () => {
    // Breaks if Teams is pinned to light again, a theme change is ignored,
    // contrast is left light, or the host's theme leaks into the saved
    // browser preference.
    render(
      <TeamsProvider>
        <ToggleProbe />
      </TeamsProvider>
    );

    await waitFor(() => expect(isDark()).toBe(true));
    expect(screen.getByText('toggle hidden')).toBeTruthy();

    act(() => teams.onThemeChange('default'));
    expect(isDark()).toBe(false);

    act(() => teams.onThemeChange('contrast'));
    expect(isDark()).toBe(true);

    expect(window.localStorage.getItem('ss-color-scheme')).toBeNull();
  });
});
