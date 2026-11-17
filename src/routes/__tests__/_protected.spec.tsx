import { QueryClient } from '@tanstack/react-query';
import { isRedirect, redirect } from '@tanstack/react-router';
import { describe, expect, it, vi } from 'vitest';

import * as auth from '@/platform/auth';
import { TransientAuthError } from '@/platform/auth/errors';

import { Route as ProtectedRoute } from '@/routes/_protected';

describe('protected route beforeLoad', () => {
  const mockQueryClient = () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    // Pre-seed session query so ensureQueryData calls the adapter
    return qc;
  };

  it('redirects to /login when session is null', async () => {
    vi.spyOn(auth, 'getAuthAdapter').mockReturnValue({
      getSession: vi.fn(async () => null),
      getAccessToken: vi.fn(async () => ''),
      signIn: vi.fn(async () => undefined),
      signOut: vi.fn(async () => undefined),
      getStoredRedirectUrl: vi.fn(() => null),
    } as unknown as ReturnType<typeof auth.getAuthAdapter>);

    const qc = mockQueryClient();
    const beforeLoad = (
      ProtectedRoute as unknown as {
        options: { beforeLoad: (ctx: any) => Promise<void> };
      }
    ).options.beforeLoad;

    await expect(
      beforeLoad({ location: { href: '/x' }, context: { queryClient: qc } })
    ).rejects.toMatchObject(
      redirect({ to: '/login', search: { redirect: '/x' } })
    );
  });

  it.each([
    [
      'the network failed',
      'stays on the page',
      false,
      new TransientAuthError(),
    ],
    [
      'the session is dead',
      'redirects to /login',
      true,
      new Error('Silent token failed'),
    ],
  ])(
    'when a token request fails because %s, the navigation %s',
    async (_name, _outcome, redirects, error) => {
      // Breaks if offline counts as signed out: clicking a link on flaky
      // Wi-Fi lands on the login page instead of an inline network error.
      vi.spyOn(auth, 'getAuthAdapter').mockReturnValue({
        getSession: vi.fn(async () => ({ accountId: 'u' })),
        getAccessToken: vi.fn(async () => {
          throw error;
        }),
        signIn: vi.fn(async () => undefined),
        signOut: vi.fn(async () => undefined),
        getStoredRedirectUrl: vi.fn(() => null),
      } as unknown as ReturnType<typeof auth.getAuthAdapter>);

      const beforeLoad = (
        ProtectedRoute as unknown as {
          options: { beforeLoad: (ctx: unknown) => Promise<void> };
        }
      ).options.beforeLoad;
      // A string, not the redirect itself: vitest cannot report a failure
      // whose value is the router's redirect (DataCloneError).
      const outcome = await beforeLoad({
        location: { href: '/x' },
        context: { queryClient: mockQueryClient() },
      }).then(
        () => 'carried on',
        (e: unknown) => (isRedirect(e) ? 'redirected' : 'threw')
      );

      expect(outcome).toBe(redirects ? 'redirected' : 'carried on');
    }
  );

  it('passes with valid session and token', async () => {
    vi.spyOn(auth, 'getAuthAdapter').mockReturnValue({
      getSession: vi.fn(async () => ({ accountId: 'u' })),
      getAccessToken: vi.fn(async () => 'token'),
      signIn: vi.fn(async () => undefined),
      signOut: vi.fn(async () => undefined),
      getStoredRedirectUrl: vi.fn(() => null),
    } as unknown as ReturnType<typeof auth.getAuthAdapter>);

    const qc = mockQueryClient();
    const beforeLoad = (
      ProtectedRoute as unknown as {
        options: { beforeLoad: (ctx: any) => Promise<void> };
      }
    ).options.beforeLoad;

    await expect(
      beforeLoad({ location: { href: '/x' }, context: { queryClient: qc } })
    ).resolves.toBeUndefined();
  });
});
