// routes/login.tsx
import { createFileRoute, redirect, useSearch } from '@tanstack/react-router';

import { createAuthAdapter } from '@/platform/auth';
import { getApiScopes } from '@/platform/auth/config';
import { normalizeRedirectPath } from '@/platform/auth/utils';

import { Login } from '@/pages/Login/Login';

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ location }) => {
    const auth = createAuthAdapter();
    const session = await auth.getSession();
    if (session) {
      // Important: having a cached account/session does NOT mean we have a usable token.
      // If silent token acquisition fails, stay on /login to allow interactive sign-in,
      // otherwise we can get stuck in a redirect loop with /_protected.
      try {
        await auth.getAccessToken({ scopes: getApiScopes(), silentOnly: true });
      } catch {
        return;
      }

      const stored = auth.getStoredRedirectUrl?.();
      const searchRedirect = new URLSearchParams(location.search ?? '').get('redirect');
      const to = normalizeRedirectPath(stored || searchRedirect, '/workspace');
      auth.clearStoredRedirectUrl?.();
      throw redirect({ to });
    }
  },
  component: () => {
    const search = useSearch({ from: '/login' }) as { redirect?: string };
    const redirectTo = normalizeRedirectPath(search.redirect, '/workspace');
    return <Login redirectTo={redirectTo} />;
  },
});
