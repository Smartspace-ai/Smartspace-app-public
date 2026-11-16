import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAuthed } from '@/platform/api/fetchAuthed';
import { TransientAuthError } from '@/platform/auth/errors';

const { mockGetAccessToken, mockHandleSessionExpired } = vi.hoisted(() => ({
  mockGetAccessToken: vi.fn(),
  mockHandleSessionExpired: vi.fn(),
}));

vi.mock('@/platform/auth', () => ({
  getAuthAdapter: () => ({ getAccessToken: mockGetAccessToken }),
}));

vi.mock('@/platform/auth/sessionExpiry', async (orig) => ({
  ...((await orig()) as object),
  handleSessionExpired: mockHandleSessionExpired,
}));

describe('fetchAuthed when no token can be had', () => {
  beforeEach(() => {
    mockGetAccessToken.mockReset();
    mockHandleSessionExpired.mockReset();
  });

  it.each([
    ['the session is dead', true, new Error('Silent token failed')],
    ['the network failed', false, new TransientAuthError()],
  ])('when %s, it starts recovery: %s', async (_name, recovers, error) => {
    // Breaks if a send with a dead session only fails: the user gets the
    // send's error toast and no sign-in prompt.
    mockGetAccessToken.mockRejectedValue(error);

    await expect(
      fetchAuthed('/Messages/start', { method: 'POST' })
    ).rejects.toBe(error);

    expect(mockHandleSessionExpired).toHaveBeenCalledTimes(recovers ? 1 : 0);
  });
});
