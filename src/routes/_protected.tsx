import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { createAuthAdapter } from '@/platform/auth';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    try {
      // Give Teams/MSAL time to initialize properly (slightly longer on cold start)
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Try to get session with retry logic for Teams
      let session = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!session && attempts < maxAttempts) {
        try {
          // Recreate adapter each attempt to pick up environment/init changes
          const auth = createAuthAdapter();
          session = await auth.getSession();
          if (session) break;
        } catch (error) {
          console.warn(`Authentication attempt ${attempts + 1} failed:`, error);
        }

        attempts++;
        if (attempts < maxAttempts) {
          // Wait before retry, with increasing delay
          const delayMs = 1000 * attempts;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
      
      if (!session) {
        console.log('No valid session found after retries, redirecting to login');
        throw redirect({ to: '/login', search: { redirect: location.href } });
      }
      
      console.log('Authentication successful:', session);
    } catch (error) {
      console.error('Authentication failed:', error);
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
})

