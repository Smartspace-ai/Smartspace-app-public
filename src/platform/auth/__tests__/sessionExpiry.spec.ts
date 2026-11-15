import { AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRefresh,
  mockPopup,
  mockSetSessionExpired,
  mockSetAuthStuck,
  state,
} = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockPopup: vi.fn(),
  mockSetSessionExpired: vi.fn(),
  mockSetAuthStuck: vi.fn(),
  state: { inTeams: false },
}));

vi.mock('@/platform/auth/providers/msalWeb', () => ({
  refreshWebTokenSilently: mockRefresh,
  signInWithPopup: mockPopup,
}));

vi.mock('@/platform/auth/msalConfig', () => ({
  isInTeams: () => state.inTeams,
}));

vi.mock('@/platform/auth/runtime', () => ({
  getAuthRuntimeState: () => ({ isInTeams: null }),
  setSessionExpired: mockSetSessionExpired,
  setAuthStuck: mockSetAuthStuck,
}));

vi.mock('@/platform/log', () => ({
  ssInfoAlways: vi.fn(),
  ssWarn: vi.fn(),
}));

import {
  handleSessionExpired,
  isReauthRequired,
  onSessionRenewed,
  renewSessionWithPopup,
  resetSessionExpiry,
} from '@/platform/auth/sessionExpiry';

describe('isReauthRequired', () => {
  it('is true for the header on a fetch Headers object (case-insensitive)', () => {
    const h = new Headers();
    h.set('X-Reauth-Required', 'true');
    expect(isReauthRequired(h)).toBe(true);
  });

  it('is true for AxiosHeaders', () => {
    const h = AxiosHeaders.from({ 'x-reauth-required': 'true' });
    expect(isReauthRequired(h)).toBe(true);
  });

  it('is true for a plain record', () => {
    expect(isReauthRequired({ 'x-reauth-required': 'true' })).toBe(true);
  });

  it('is false when absent (domain 401) or malformed', () => {
    expect(isReauthRequired(new Headers())).toBe(false);
    expect(
      isReauthRequired({ 'content-type': 'application/problem+json' })
    ).toBe(false);
    expect(isReauthRequired(null)).toBe(false);
    expect(isReauthRequired(undefined)).toBe(false);
  });
});

// MSAL's error for a popup the user closed, or one the browser blocked.
const popupError = (errorCode: string) =>
  Object.assign(new Error(errorCode), { errorCode });

describe('session expiry recovery', () => {
  const renewed = vi.fn();
  let unsubscribe: () => void = () => undefined;

  beforeEach(() => {
    state.inTeams = false;
    resetSessionExpiry();
    mockRefresh.mockReset();
    mockRefresh.mockResolvedValue(undefined);
    mockPopup.mockReset();
    mockPopup.mockResolvedValue(undefined);
    mockSetSessionExpired.mockClear();
    mockSetAuthStuck.mockClear();
    renewed.mockClear();
    unsubscribe();
    unsubscribe = onSessionRenewed(renewed);
  });

  it('web: concurrent failures make one silent refresh, open no popup, and re-run the failed screens', async () => {
    // Breaks if the web path opens a popup or redirects with no click, or if
    // the refresh is not de-duplicated.
    await Promise.all([
      handleSessionExpired(),
      handleSessionExpired(),
      handleSessionExpired(),
    ]);

    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockPopup).not.toHaveBeenCalled();
    expect(renewed).toHaveBeenCalledTimes(1);
    expect(mockSetSessionExpired).not.toHaveBeenCalled();
  });

  it('web: a failed refresh shows the sign-in prompt, and does not open a popup', async () => {
    mockRefresh.mockRejectedValue(new Error('interaction_required'));

    await handleSessionExpired();

    expect(mockSetSessionExpired).toHaveBeenCalledWith(true);
    expect(mockPopup).not.toHaveBeenCalled();
    expect(renewed).not.toHaveBeenCalled();
  });

  it('web: while the prompt waits for its click, more failures spend no attempts', async () => {
    // Breaks if each failure retries: the budget runs out into the stuck
    // prompt while the user is reading the sign-in prompt.
    mockRefresh.mockRejectedValue(new Error('interaction_required'));

    for (let i = 0; i < 5; i += 1) await handleSessionExpired();

    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockSetAuthStuck).not.toHaveBeenCalledWith(true);
  });

  it('web: a server that rejects every fresh token reaches the stuck prompt after 3 attempts in 60s', async () => {
    // Breaks if a silent success resets the attempt log: every refresh
    // succeeds, every request 401s again, and the app refetches forever.
    await handleSessionExpired();
    await handleSessionExpired();
    await handleSessionExpired();
    expect(mockRefresh).toHaveBeenCalledTimes(3);

    await handleSessionExpired();

    expect(mockRefresh).toHaveBeenCalledTimes(3);
    expect(mockSetAuthStuck).toHaveBeenCalledWith(true);
  });

  it('the prompt click opens the popup at once, with nothing awaited first', () => {
    // Breaks if anything is awaited before the popup: the browser no longer
    // counts it as part of the click and blocks it.
    void renewSessionWithPopup();

    expect(mockPopup).toHaveBeenCalledTimes(1);
  });

  it('repeated clicks while the popup is open share one popup', async () => {
    let finish: () => void = () => undefined;
    mockPopup.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );

    const first = renewSessionWithPopup();
    const second = renewSessionWithPopup();
    finish();
    await Promise.all([first, second]);

    expect(mockPopup).toHaveBeenCalledTimes(1);
  });

  it('a completed popup renews: it clears the prompt and the attempt log, and re-runs the failed screens', async () => {
    mockRefresh.mockRejectedValue(new Error('interaction_required'));
    await handleSessionExpired();
    mockSetSessionExpired.mockClear();

    await renewSessionWithPopup();

    expect(renewed).toHaveBeenCalledTimes(1);
    expect(mockSetSessionExpired).toHaveBeenCalledWith(false);
    expect(sessionStorage.getItem('ss_reauth_log')).toBeNull();
  });

  it.each(['user_cancelled', 'popup_window_error', 'interaction_in_progress'])(
    'a popup that ends in %s leaves the prompt up and renews nothing',
    async (code) => {
      // Breaks if a failed popup counts as a renewal: the prompt goes and the
      // user is left with a dead session and no way to sign in.
      mockRefresh.mockRejectedValue(new Error('interaction_required'));
      await handleSessionExpired();
      mockSetSessionExpired.mockClear();
      mockPopup.mockRejectedValue(popupError(code));

      await renewSessionWithPopup();

      expect(renewed).not.toHaveBeenCalled();
      expect(mockSetSessionExpired).not.toHaveBeenCalled();
    }
  );

  it('teams: flags the prompt, with no silent refresh and no popup', async () => {
    state.inTeams = true;

    await handleSessionExpired();

    expect(mockSetSessionExpired).toHaveBeenCalledWith(true);
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockPopup).not.toHaveBeenCalled();
  });
});
