import { AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSignIn, mockSetSessionExpired, mockSetAuthStuck, state } =
  vi.hoisted(() => ({
    mockSignIn: vi.fn().mockResolvedValue(undefined),
    mockSetSessionExpired: vi.fn(),
    mockSetAuthStuck: vi.fn(),
    state: { inTeams: false },
  }));

vi.mock('@/platform/auth/index', () => ({
  getAuthAdapter: () => ({ signIn: mockSignIn }),
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

describe('handleSessionExpired', () => {
  beforeEach(() => {
    state.inTeams = false;
    resetSessionExpiry();
    mockSignIn.mockReset();
    mockSignIn.mockResolvedValue(undefined);
    mockSetSessionExpired.mockClear();
    mockSetAuthStuck.mockClear();
  });

  it('web: redirects via signIn() exactly once for concurrent failures', async () => {
    await Promise.all([
      handleSessionExpired(),
      handleSessionExpired(),
      handleSessionExpired(),
    ]);
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSetSessionExpired).not.toHaveBeenCalled();
  });

  it('teams: flags the prompt instead of auto signing in', async () => {
    state.inTeams = true;
    await handleSessionExpired();
    expect(mockSetSessionExpired).toHaveBeenCalledWith(true);
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('stops redirecting and flags authStuck after too many attempts', async () => {
    // signIn rejects so the in-progress guard resets between attempts (mirrors
    // the page reload that would happen after each real redirect).
    mockSignIn.mockReset();
    mockSignIn.mockRejectedValue(new Error('still 401'));

    await handleSessionExpired();
    await handleSessionExpired();
    await handleSessionExpired();
    expect(mockSignIn).toHaveBeenCalledTimes(3);

    mockSignIn.mockClear();
    await handleSessionExpired(); // 4th within the window — over budget
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockSetAuthStuck).toHaveBeenCalledWith(true);
  });
});
