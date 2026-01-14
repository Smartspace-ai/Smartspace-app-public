// routes/login.tsx
import { createFileRoute, redirect, useNavigate, useSearch } from '@tanstack/react-router';

import { createAuthAdapter } from '@/platform/auth';
import { normalizeRedirectPath } from '@/platform/routing/normalizeRedirectPath';

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
        await auth.getAccessToken({ silentOnly: true });
      } catch {
        return;
      }

      const stored = auth.getStoredRedirectUrl?.();
      const searchRedirect = new URLSearchParams(location.search ?? '').get('redirect');
      const to = normalizeRedirectPath(stored || searchRedirect, '/workspace');
      // Main auth adapter doesn't expose a clear helper; clear here to avoid sticky redirects.
      try { sessionStorage.removeItem('msalRedirectUrl'); } catch { /* ignore */ }
      throw redirect({ to });
    }
  },
  component: LoginRouteComponent,
});

function LoginRouteComponent() {
  const search = useSearch({ from: '/login' }) as { redirect?: string };
  const redirectTo = normalizeRedirectPath(search.redirect, '/workspace');
  const navigate = useNavigate();
  return (
    <Login
      redirectTo={redirectTo}
      onNavigate={(to) => navigate({ to, replace: true })}
    />
  );
}
