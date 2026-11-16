import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  setRuntimeIsInTeams,
  setSessionExpired,
} from '@/platform/auth/runtime';
import { resetSessionExpiry } from '@/platform/auth/sessionExpiry';

import { SessionExpiryPrompt } from '../SessionExpiryPrompt';

const { mockPopup, mockSignIn } = vi.hoisted(() => ({
  mockPopup: vi.fn(),
  mockSignIn: vi.fn(),
}));

vi.mock('@/platform/auth/providers/msalWeb', () => ({
  refreshWebTokenSilently: vi.fn(),
  signInWithPopup: mockPopup,
}));

vi.mock('@/platform/auth/session', async (orig) => ({
  ...((await orig()) as object),
  useAuth: () => ({ signIn: mockSignIn }),
}));

afterEach(() => {
  act(() => {
    resetSessionExpiry();
    setRuntimeIsInTeams(false);
  });
  mockPopup.mockReset();
  mockSignIn.mockReset();
});

describe('session expiry prompt', () => {
  it('web: Sign in opens the popup inside the click, and a completed popup closes the prompt', async () => {
    // Breaks if the click awaits before the popup (the browser blocks it), or
    // signs in through signIn() (a full-page redirect that loses the page).
    let finish: () => void = () => undefined;
    mockPopup.mockReturnValue(
      new Promise((resolve) => {
        finish = () => resolve({ switchedAccount: false });
      })
    );
    act(() => setSessionExpired(true));
    render(<SessionExpiryPrompt />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(mockPopup).toHaveBeenCalledTimes(1);
    expect(mockSignIn).not.toHaveBeenCalled();

    await act(async () => finish());
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('web: a popup that did not complete offers the full-page sign-in, back to this page', async () => {
    // Breaks if the prompt only re-offers the popup: when another tab holds
    // MSAL's sign-in lock, every click fails and the only way out is a reload.
    mockPopup.mockRejectedValue(
      Object.assign(new Error('interaction_in_progress'), {
        errorCode: 'interaction_in_progress',
      })
    );
    mockSignIn.mockReturnValue(new Promise(() => undefined));
    act(() => setSessionExpired(true));
    render(<SessionExpiryPrompt />);
    expect(screen.queryByText(/Sign-in didn’t finish/)).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Sign in on a full page instead' })
    );

    expect(mockSignIn).toHaveBeenCalledWith({
      redirectUrl:
        window.location.pathname +
        window.location.search +
        window.location.hash,
    });
  });

  it('web: a prompt that closed and opens again does not still say the last sign-in failed', async () => {
    // Breaks if the failed-popup state outlives the prompt: the next expiry
    // opens with "Sign-in didn't finish" before the user has tried.
    mockPopup.mockRejectedValue(
      Object.assign(new Error('user_cancelled'), {
        errorCode: 'user_cancelled',
      })
    );
    act(() => setSessionExpired(true));
    render(<SessionExpiryPrompt />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    });
    expect(screen.getByText(/Sign-in didn’t finish/)).toBeTruthy();

    // Closed by a silent refresh when the tab came back, then expired again.
    act(() => setSessionExpired(false));
    act(() => setSessionExpired(true));

    expect(screen.queryByText(/Sign-in didn’t finish/)).toBeNull();
  });

  it('web: a closed popup leaves the prompt up, ready for another click', async () => {
    mockPopup.mockRejectedValue(
      Object.assign(new Error('user_cancelled'), {
        errorCode: 'user_cancelled',
      })
    );
    act(() => setSessionExpired(true));
    render(<SessionExpiryPrompt />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    });

    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Sign in' }) as HTMLButtonElement)
        .disabled
    ).toBe(false);
  });

  it('teams: the button signs in through signIn(), not the web popup', async () => {
    mockSignIn.mockResolvedValue(undefined);
    act(() => {
      setRuntimeIsInTeams(true);
      setSessionExpired(true);
    });
    render(<SessionExpiryPrompt />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    });

    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockPopup).not.toHaveBeenCalled();
  });
});
