// src/routes/_protected.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { createAuthAdapter } from '@/platform/auth';
import { normalizeRedirectPath } from '@/platform/routing/normalizeRedirectPath';

import { ProtectedErrorBoundary } from '@/app/ui/RouteErrorEnvelope';
import { RouteProgressBar } from '@/app/ui/RouteProgressBar';

export const Route = createFileRoute('/_protected')({
  // Runs on navigation (and on intent prefetch if enabled).
  // If you find redirects during hover annoying, disable preload on links into /_protected.
  errorComponent: ProtectedErrorBoundary,
  beforeLoad: async ({ location }) => {
    const auth = createAuthAdapter();
    const session = await auth.getSession();
    const href = (() => {
      const h = (location as unknown as { href?: unknown })?.href;
      return typeof h === 'string' ? h : undefined;
    })();
    const redirectTo = normalizeRedirectPath(
      (() => {
        if (typeof location?.pathname !== 'string') return href;
        const rawSearch = (location as unknown as { search?: unknown })?.search;
        let search = '';
        if (typeof rawSearch === 'string') {
          search = rawSearch
            ? rawSearch.startsWith('?')
              ? rawSearch
              : `?${rawSearch}`
            : '';
        } else if (rawSearch && typeof rawSearch === 'object') {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(
            rawSearch as Record<string, unknown>
          )) {
            if (value == null) continue;
            if (Array.isArray(value)) {
              for (const v of value) {
                if (v == null) continue;
                params.append(key, String(v));
              }
            } else {
              params.set(key, String(value));
            }
          }
          const qs = params.toString();
          search = qs ? `?${qs}` : '';
        }
        const hash = typeof location?.hash === 'string' ? location.hash : '';
        return `${location.pathname}${search}${hash}`;
      })(),
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
