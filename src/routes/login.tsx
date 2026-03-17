// routes/login.tsx
import { useQueryClient } from '@tanstack/react-query';
import {
  createFileRoute,
  redirect,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { useEffect } from 'react';

import { getAuthAdapter } from '@/platform/auth';
import { sessionQueryOptions } from '@/platform/auth/sessionQuery';
import { removeSplash } from '@/platform/boot/removeSplash';
import { normalizeRedirectPath } from '@/platform/routing/normalizeRedirectPath';

import { Login } from '@/pages/Login/Login';

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async ({ context, location }) => {
    // Cached session check via React Query
    const session = await context.queryClient.ensureQueryData(
      sessionQueryOptions()
    );
    if (session) {
      // Important: having a cached account/session does NOT mean we have a usable token.
      // If silent token acquisition fails, stay on /login to allow interactive sign-in,
      // otherwise we can get stuck in a redirect loop with /_protected.
      const auth = getAuthAdapter();
      try {
        await auth.getAccessToken({ silentOnly: true });
      } catch {
        return;
      }

      const stored = auth.getStoredRedirectUrl?.();
      const searchRedirect = new URLSearchParams(location.search ?? '').get(
        'redirect'
      );
      const to = normalizeRedirectPath(stored || searchRedirect, '/workspace');
      // Clear stored redirect URL to avoid sticky redirects.
      try {
        sessionStorage.removeItem('msalRedirectUrl');
      } catch {
        /* ignore */
      }
      throw redirect({ to });
    }
  },
  component: LoginRouteComponent,
});

function LoginRouteComponent() {
  useEffect(() => {
    removeSplash();
  }, []);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { redirect: redirectParam } = useSearch({ from: '/login' });
  const redirectTo = normalizeRedirectPath(redirectParam, '/workspace');

  return (
    <Login
      redirectTo={redirectTo}
      onNavigate={(to) => {
        // Clear the cached null session so /_protected's beforeLoad
        // fetches fresh and finds the newly authenticated account.
        queryClient.removeQueries({ queryKey: ['auth', 'session'] });
        navigate({ to });
      }}
    />
  );
}
