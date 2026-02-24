import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { getAuthAdapter } from '@/platform/auth';
import {
  SESSION_QUERY_KEY,
  sessionQueryOptions,
} from '@/platform/auth/sessionQuery';
import { normalizeRedirectPath } from '@/platform/routing/normalizeRedirectPath';

import { ProtectedErrorBoundary } from '@/app/ui/RouteErrorEnvelope';
import { RouteProgressBar } from '@/app/ui/RouteProgressBar';

export const Route = createFileRoute('/_protected')({
  // Runs on navigation (and on intent prefetch if enabled).
  // If you find redirects during hover annoying, disable preload on links into /_protected.
  errorComponent: ProtectedErrorBoundary,
  beforeLoad: async ({ context, location }) => {
    const redirectTo = normalizeRedirectPath(
      formatLocationHref(location),
      '/workspace'
    );

    // Cached check — instant if session was recently verified (React Query staleTime)
    const session = await context.queryClient.ensureQueryData(
      sessionQueryOptions()
    );
    if (!session)
      throw redirect({ to: '/login', search: { redirect: redirectTo } });

    // Token validation (MSAL/NAA have their own caching)
    try {
      await getAuthAdapter().getAccessToken({ silentOnly: true });
    } catch {
      context.queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
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
