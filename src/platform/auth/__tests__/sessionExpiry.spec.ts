import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRefresh,
  mockCheck,
  mockPopup,
  mockSetSessionExpired,
  mockSetAuthStuck,
  state,
} = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockCheck: vi.fn(),
  mockPopup: vi.fn(),
  mockSetSessionExpired: vi.fn(),
  mockSetAuthStuck: vi.fn(),
  state: { inTeams: false, sessionExpired: false },
}));

vi.mock('@/platform/auth/providers/msalWeb', () => ({
  refreshWebTokenSilently: mockRefresh,
  checkWebTokenSilently: mockCheck,
  signInWithPopup: mockPopup,
}));

vi.mock('@/platform/auth/msalConfig', () => ({
  isInTeams: () => state.inTeams,
}));

vi.mock('@/platform/auth/runtime', () => ({
  getAuthRuntimeState: () => ({
    isInTeams: null,
    sessionExpired: state.sessionExpired,
    authStuck: false,
  }),
  setSessionExpired: mockSetSessionExpired,
  setAuthStuck: mockSetAuthStuck,
}));

vi.mock('@/platform/log', () => ({
  ssInfoAlways: vi.fn(),
  ssWarn: vi.fn(),
}));

import {
  checkSessionOnVisible,
  handleSessionExpired,
  isAuthResponsePage,
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
    state.sessionExpired = false;
    resetSessionExpiry();
    mockRefresh.mockReset();
    mockRefresh.mockResolvedValue(undefined);
    mockCheck.mockReset();
    mockCheck.mockResolvedValue(undefined);
    mockPopup.mockReset();
    mockPopup.mockResolvedValue({ switchedAccount: false });
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
      new Promise((resolve) => {
        finish = () => resolve({ switchedAccount: false });
      })
    );

    const first = renewSessionWithPopup();
    const second = renewSessionWithPopup();
    finish();

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
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

      // False tells the prompt to offer the full-page sign-in.
      await expect(renewSessionWithPopup()).resolves.toBe(false);

      expect(renewed).not.toHaveBeenCalled();
      expect(mockSetSessionExpired).not.toHaveBeenCalled();
    }
  );

  it('a popup where the user picked a different account reloads the page instead of carrying on', async () => {
    // Breaks if the switch is treated as a renewal: the previous user's
    // composer text and realtime groups carry over to the new user.
    const reload = vi.fn();
    const realLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...realLocation, pathname: '/', hash: '', reload },
    });
    mockPopup.mockResolvedValue({ switchedAccount: true });

    try {
      await renewSessionWithPopup();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: realLocation,
      });
    }

    expect(reload).toHaveBeenCalledTimes(1);
    expect(renewed).not.toHaveBeenCalled();
  });

  it('one failing renewal listener does not stop the others', async () => {
    const offThrowing = onSessionRenewed(() => {
      throw new Error('listener failed');
    });
    // Registered after the throwing one, so it runs after it.
    const later = vi.fn();
    const offLater = onSessionRenewed(later);

    await renewSessionWithPopup();
    offThrowing();
    offLater();

    expect(later).toHaveBeenCalledTimes(1);
  });

  it("does nothing inside MSAL's hidden renewal frame, so it spends none of the tab's attempts", async () => {
    // Breaks if the frame runs recovery: it shares sessionStorage with the
    // tab, so it uses up the tab's 3 attempts where no one can see it.
    const realLocation = window.location;
    const realTop = window.top;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...realLocation, pathname: '/', hash: '#code=abc&state=x' },
    });
    Object.defineProperty(window, 'top', { configurable: true, value: {} });

    try {
      await handleSessionExpired();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: realLocation,
      });
      Object.defineProperty(window, 'top', {
        configurable: true,
        value: realTop,
      });
    }

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('ss_reauth_log')).toBeNull();
  });

  it('teams: flags the prompt, with no silent refresh and no popup', async () => {
    state.inTeams = true;

    await handleSessionExpired();

    expect(mockSetSessionExpired).toHaveBeenCalledWith(true);
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockPopup).not.toHaveBeenCalled();
  });

  it('web: a refresh that fails on the network shows no prompt, and the next failure tries again', async () => {
    // Breaks if an offline blip is treated as expiry (the prompt offers a
    // sign-in that cannot work offline), or if the guard stays set (recovery
    // never runs again once the network is back).
    mockRefresh.mockRejectedValueOnce(popupError('no_network_connectivity'));

    await handleSessionExpired();
    expect(mockSetSessionExpired).not.toHaveBeenCalled();
    expect(renewed).not.toHaveBeenCalled();

    await handleSessionExpired();
    expect(mockRefresh).toHaveBeenCalledTimes(2);
    expect(renewed).toHaveBeenCalledTimes(1);
  });
});

describe('isAuthResponsePage', () => {
  it.each([
    ['the sign-in popup', true, '#code=abc&state=x', true, false],
    [
      "MSAL's hidden renewal iframe",
      true,
      '#error=login_required',
      false,
      true,
    ],
    ['the app in Teams (a frame, no auth response)', false, '', false, true],
    ['a normal tab with a hash', false, '#code=abc', false, false],
  ])(
    '%s is an auth-response page: %s',
    (_name, expected, hash, hasOpener, inFrame) => {
      // Breaks if main.tsx's guard misses the hidden iframe (the app boots in
      // it, now that web renewal returns to the site root) or catches Teams
      // (the app never starts there).
      const realLocation = window.location;
      const realTop = window.top;
      const realOpener = window.opener;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...realLocation, pathname: '/', hash },
      });
      Object.defineProperty(window, 'top', {
        configurable: true,
        value: inFrame ? {} : window,
      });
      Object.defineProperty(window, 'opener', {
        configurable: true,
        value: hasOpener ? {} : null,
      });

      try {
        expect(isAuthResponsePage()).toBe(expected);
      } finally {
        Object.defineProperty(window, 'location', {
          configurable: true,
          value: realLocation,
        });
        Object.defineProperty(window, 'top', {
          configurable: true,
          value: realTop,
        });
        Object.defineProperty(window, 'opener', {
          configurable: true,
          value: realOpener,
        });
      }
    }
  );
});

describe('session check when the tab becomes visible', () => {
  const renewed = vi.fn();
  let unsubscribe: () => void = () => undefined;

  beforeEach(() => {
    state.inTeams = false;
    state.sessionExpired = false;
    resetSessionExpiry();
    mockRefresh.mockReset();
    mockRefresh.mockResolvedValue(undefined);
    mockCheck.mockReset();
    mockCheck.mockResolvedValue(undefined);
    mockPopup.mockReset();
    mockSetSessionExpired.mockClear();
    renewed.mockClear();
    unsubscribe();
    unsubscribe = onSessionRenewed(renewed);
  });

  it.each([
    ['sign-in is required', new InteractionRequiredAuthError('login_required')],
    // The refresh token expired and the hidden renewal iframe timed out.
    ['the renewal iframe timed out', popupError('monitor_window_timeout')],
  ])(
    'a session that died while the tab was hidden (%s) shows the prompt before the user acts, with no popup',
    async (_name, error) => {
      // Breaks if the check is not wired to recovery, or only escalates some
      // failures: the user types into a dead page and finds out on send.
      mockCheck.mockRejectedValue(error);
      mockRefresh.mockRejectedValue(error);

      await checkSessionOnVisible();

      expect(mockSetSessionExpired).toHaveBeenCalledWith(true);
      expect(mockPopup).not.toHaveBeenCalled();
    }
  );

  it('a check that fails on the network starts no recovery', async () => {
    mockCheck.mockRejectedValue(popupError('no_network_connectivity'));

    await checkSessionOnVisible();

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockSetSessionExpired).not.toHaveBeenCalled();
  });

  it('a prompt left up closes when the silent refresh now works, and keeps the attempt log', async () => {
    // Breaks if a silent success clears the attempt log (a server rejecting
    // every token loops forever), or if the guard stays set (the next expiry
    // never recovers).
    mockRefresh.mockRejectedValueOnce(
      new InteractionRequiredAuthError('login_required')
    );
    await handleSessionExpired();
    state.sessionExpired = true;
    mockSetSessionExpired.mockClear();

    await checkSessionOnVisible();

    expect(mockSetSessionExpired).toHaveBeenCalledWith(false);
    expect(renewed).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('ss_reauth_log')).not.toBeNull();

    state.sessionExpired = false;
    await handleSessionExpired();
    expect(mockRefresh).toHaveBeenCalledTimes(3);
  });

  it('a prompt left up stays up when the silent refresh still fails', async () => {
    mockRefresh.mockRejectedValue(
      new InteractionRequiredAuthError('login_required')
    );
    await handleSessionExpired();
    state.sessionExpired = true;
    mockSetSessionExpired.mockClear();

    await checkSessionOnVisible();

    expect(mockSetSessionExpired).not.toHaveBeenCalled();
    expect(renewed).not.toHaveBeenCalled();
  });

  it('a prompt left up stays up when the user clicks Sign in during the refresh, so the popup finishes it', async () => {
    // Breaks if the refresh closes the prompt under an open popup: a popup
    // that then fails leaves no prompt to retry from.
    mockRefresh.mockRejectedValueOnce(
      new InteractionRequiredAuthError('login_required')
    );
    await handleSessionExpired();
    state.sessionExpired = true;
    mockSetSessionExpired.mockClear();
    let finishRefresh: () => void = () => undefined;
    mockRefresh.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishRefresh = resolve;
      })
    );
    let closePopup: () => void = () => undefined;
    mockPopup.mockReturnValue(
      new Promise((_resolve, reject) => {
        closePopup = () => reject(popupError('user_cancelled'));
      })
    );

    const check = checkSessionOnVisible();
    const popup = renewSessionWithPopup();
    finishRefresh();
    await check;

    expect(mockSetSessionExpired).not.toHaveBeenCalled();
    expect(renewed).not.toHaveBeenCalled();

    closePopup();
    await popup;
  });

  it('teams: does nothing', async () => {
    state.inTeams = true;

    await checkSessionOnVisible();

    expect(mockCheck).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
