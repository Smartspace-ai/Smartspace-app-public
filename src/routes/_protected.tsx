// src/routes/_protected.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { createAuthAdapter } from '@/platform/auth';

import { ProtectedErrorBoundary } from '@/app/ui/RouteErrorEnvelope';
import { RouteProgressBar } from '@/app/ui/RouteProgressBar';

export const Route = createFileRoute('/_protected')({
  // Runs on navigation (and on intent prefetch if enabled).
  // If you find redirects during hover annoying, disable preload on links into /_protected.
  errorComponent: ProtectedErrorBoundary,
  beforeLoad: async ({ location }) => {
    try {
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
      } catch {
        throw redirect({ to: '/login', search: { redirect: location.href } });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Authentication failed:', error);
      throw redirect({ to: '/login', search: { redirect: location.href } });
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
