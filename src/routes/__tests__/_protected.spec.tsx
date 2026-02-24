import { QueryClient } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { describe, expect, it, vi } from 'vitest';

import * as auth from '@/platform/auth';

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
