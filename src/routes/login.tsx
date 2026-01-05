// routes/login.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

import { createAuthAdapter } from '@/platform/auth';
import { normalizeRedirectPath } from '@/platform/auth/utils';

import { Login } from '@/pages/Login/Login';

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ location }) => {
    const auth = createAuthAdapter();
    const session = await auth.getSession();
    if (session) {
      const stored = auth.getStoredRedirectUrl?.();
      const searchRedirect = new URLSearchParams(location.search ?? '').get('redirect');
      const to = normalizeRedirectPath(stored || searchRedirect, '/workspace');
      auth.clearStoredRedirectUrl?.();
      throw redirect({ to });
    }
  },
  component: Login,
});
