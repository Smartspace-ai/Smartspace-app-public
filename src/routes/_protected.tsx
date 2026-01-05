// src/routes/_protected.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { createAuthAdapter } from '@/platform/auth';
import { normalizeRedirectPath } from '@/platform/auth/utils';

import { ProtectedErrorBoundary } from '@/app/ui/RouteErrorEnvelope';
import { RouteProgressBar } from '@/app/ui/RouteProgressBar';

export const Route = createFileRoute('/_protected')({
  // Runs on navigation (and on intent prefetch if enabled).
  // If you find redirects during hover annoying, disable preload on links into /_protected.
  errorComponent: ProtectedErrorBoundary,
  beforeLoad: async ({ location }) => {
    const auth = createAuthAdapter();
    const session = await auth.getSession();
    const redirectTo = normalizeRedirectPath(
      typeof location?.pathname === 'string'
        ? `${location.pathname}${location.search ?? ''}${location.hash ?? ''}`
        : (location as any)?.href,
      '/workspace'
    );
    if (!session) throw redirect({ to: '/login', search: { redirect: redirectTo } });
    try {
      // Ensure we can acquire an access token silently; otherwise redirect to login
      await auth.getAccessToken({ silentOnly: true });
    } catch {
      throw redirect({ to: '/login', search: { redirect: redirectTo } });
    }
  },

  component: () => (
    <>
      {/* Global top progress bar for route transitions (with a small delay to avoid flicker) */}
      <RouteProgressBar />
      <Outlet />
    </>
  ),
});
