// routes/login.tsx
import {
  createFileRoute,
  redirect,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';

import { getAuthAdapter } from '@/platform/auth';
import { sessionQueryOptions } from '@/platform/auth/sessionQuery';
import { normalizeRedirectPath } from '@/platform/routing/normalizeRedirectPath';

import { Login } from '@/pages/Login/Login';

export const Route = createFileRoute('/login')({
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
  return <Login />;
}
