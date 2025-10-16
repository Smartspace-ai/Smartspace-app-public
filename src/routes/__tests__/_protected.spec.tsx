import { redirect } from '@tanstack/react-router';
import { describe, expect, it, vi } from 'vitest';

import * as auth from '@/platform/auth';

import { Route as ProtectedRoute } from '@/routes/_protected';

describe('protected route beforeLoad', () => {
  it('redirects to /login when session is null', async () => {
    vi.spyOn(auth, 'createAuthAdapter').mockReturnValue({
      getSession: vi.fn(async () => null),
      getAccessToken: vi.fn(async () => ''),
      signIn: vi.fn(async () => undefined),
      signOut: vi.fn(async () => undefined),
      getStoredRedirectUrl: vi.fn(() => null),
    } as unknown as ReturnType<typeof auth.createAuthAdapter>);

    const beforeLoad = (ProtectedRoute as unknown as { options: { beforeLoad: (ctx: { location: { href: string } }) => Promise<void> } }).options.beforeLoad;

    await expect(beforeLoad({ location: { href: '/x' } })).rejects.toMatchObject(
      redirect({ to: '/login', search: { redirect: '/x' } })
    );
  });

  it('passes with valid session and token', async () => {
    vi.spyOn(auth, 'createAuthAdapter').mockReturnValue({
      getSession: vi.fn(async () => ({ accountId: 'u' })),
      getAccessToken: vi.fn(async () => 'token'),
      signIn: vi.fn(async () => undefined),
      signOut: vi.fn(async () => undefined),
      getStoredRedirectUrl: vi.fn(() => null),
    } as unknown as ReturnType<typeof auth.createAuthAdapter>);

    const beforeLoad = (ProtectedRoute as unknown as { options: { beforeLoad: (ctx: { location: { href: string } }) => Promise<void> } }).options.beforeLoad;
    await expect(beforeLoad({ location: { href: '/x' } })).resolves.toBeUndefined();
  });
});


