// routes/login.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

import { createAuthAdapter } from '@/platform/auth';
import { isInTeams } from '@/platform/auth/utils';

import { Login } from '@/pages/Login/Login';

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ location }) => {
    const auth = createAuthAdapter();
    const session = await auth.getSession();
    if (session) {
      const teamsFailed = (() => {
        try { return sessionStorage.getItem('teamsAuthFailed') === '1'; } catch { return false; }
      })();
      if (isInTeams() && teamsFailed) {
        throw redirect({ to: '/auth-failed', search: { redirect: '/workspace' } });
      }

      // IMPORTANT: Having an account cached does not guarantee we can silently acquire a token.
      // If silent token acquisition fails (InteractionRequired, bad scopes/consent, etc.),
      // do NOT auto-redirect away from /login, otherwise we can ping-pong between /login and /_protected.
      try {
        await auth.getAccessToken({ silentOnly: true });
      } catch {
        return;
      }

      const stored = auth.getStoredRedirectUrl?.();
      const searchRedirect = new URLSearchParams(location.search ?? '').get('redirect');
      const to = stored || searchRedirect || '/workspace';
      auth.clearStoredRedirectUrl?.();
      throw redirect({ to });
    }
  },
  component: Login,
});
