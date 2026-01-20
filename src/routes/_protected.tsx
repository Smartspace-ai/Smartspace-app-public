import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { createAuthAdapter } from '@/platform/auth';
import { normalizeRedirectPath } from '@/platform/routing/normalizeRedirectPath';

import { RouteProgressBar } from '@/app/ui/RouteProgressBar';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const auth = createAuthAdapter();
    const session = await auth.getSession();
    const redirectTo = normalizeRedirectPath(
      formatLocationHref(location),
      '/workspace'
    );
    if (!session)
      throw redirect({ to: '/login', search: { redirect: redirectTo } });
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

function formatLocationHref(location: {
  href?: unknown;
  pathname?: unknown;
  search?: unknown;
  hash?: unknown;
}): string | undefined {
  const href = typeof location.href === 'string' ? location.href : undefined;
  if (href) return href;

  const pathname =
    typeof location.pathname === 'string' ? location.pathname : '/';
  const hash = typeof location.hash === 'string' ? location.hash : '';
  const search =
    typeof location.search === 'string'
      ? location.search
      : location.search && typeof location.search === 'object'
      ? `?${new URLSearchParams(
          Object.entries(location.search as Record<string, unknown>)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)])
        ).toString()}`
      : '';

  return `${pathname}${search}${hash}`;
}
