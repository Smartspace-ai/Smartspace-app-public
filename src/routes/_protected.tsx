// src/routes/_protected.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { createAuthAdapter } from '@/platform/auth';
import { isInTeams } from '@/platform/auth/utils';

import { ProtectedErrorBoundary } from '@/app/ui/RouteErrorEnvelope';
import { RouteProgressBar } from '@/app/ui/RouteProgressBar';

function setTeamsAuthFailed(flag: boolean) {
  try {
    if (flag) sessionStorage.setItem('teamsAuthFailed', '1');
    else sessionStorage.removeItem('teamsAuthFailed');
  } catch {
    // ignore storage failures
  }
}

function isRouterRedirectLike(e: unknown): boolean {
  // TanStack router redirects often surface as a Response-like object with extra fields.
  if (!e || typeof e !== 'object') return false;
  const any = e as any;
  return (
    typeof any?.statusCode === 'number' &&
    (typeof any?.to === 'string' || typeof any?.href === 'string')
  );
}

export const Route = createFileRoute('/_protected')({
  // Runs on navigation (and on intent prefetch if enabled).
  // If you find redirects during hover annoying, disable preload on links into /_protected.
  errorComponent: ProtectedErrorBoundary,
  beforeLoad: async ({ location }) => {
    // Avoid paying the auth "cold start" cost on every in-app navigation.
    // We still re-check periodically (and on failures we redirect to /login).
    const AUTH_CACHE_MS = 60_000;
    const now = Date.now();
    if (lastAuthOkAt && now - lastAuthOkAt < AUTH_CACHE_MS) {
      return;
    }
    try {
      if (!inFlightAuthCheck) {
        inFlightAuthCheck = (async () => {
          // Keep the original "cold start" behavior, but only when we don't have a recent success.
          // Wait a short time to allow auth contexts to settle
          await new Promise((resolve) => setTimeout(resolve, 200));

          // Try to get session with retry logic for Teams
          let session: { accountId?: string; displayName?: string } | null = null;
          let attempts = 0;
          const maxAttempts = 3;

          while (!session && attempts < maxAttempts) {
            try {
              // Recreate adapter each attempt to pick up environment/init changes
              const auth = createAuthAdapter();
              session = await auth.getSession();
              if (session) break;
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn(`Authentication attempt ${attempts + 1} failed:`, error);
            }

            attempts++;
            if (attempts < maxAttempts) {
              // Wait before retry, with increasing delay
              const delayMs = 300 * attempts;
              await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
          }

          if (!session) {
            // eslint-disable-next-line no-console
            console.log('No valid session found after retries, redirecting to login');
            throw redirect({ to: '/login', search: { redirect: location.href } });
          }

          // eslint-disable-next-line no-console
          console.log('Authentication successful:', session);

          // Ensure we can acquire an access token silently; otherwise redirect to login
          try {
            const authForToken = createAuthAdapter();
            await authForToken.getAccessToken({ silentOnly: true });
            if (isInTeams()) setTeamsAuthFailed(false);
          } catch {
            // In Teams, redirecting to /login can cause an infinite loop when NAA/MSAL
            // fails with redirects (e.g. 307). Show a stable error screen instead.
            if (isInTeams()) setTeamsAuthFailed(true);
            throw redirect({
              to: isInTeams() ? '/auth-failed' : '/login',
              search: { redirect: location.href },
            });
          }

          lastAuthOkAt = Date.now();
        })().finally(() => {
          inFlightAuthCheck = null;
        });
      }

      await inFlightAuthCheck;
    } catch (error) {
      // If we are already redirecting, don't log or rewrite the redirect.
      if (isRouterRedirectLike(error)) throw error;
      lastAuthOkAt = 0;
      // eslint-disable-next-line no-console
      console.error('Authentication failed:', error);
      throw redirect({
        to: isInTeams() ? '/auth-failed' : '/login',
        search: { redirect: location.href },
      });
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

let lastAuthOkAt = 0;
let inFlightAuthCheck: Promise<void> | null = null;
