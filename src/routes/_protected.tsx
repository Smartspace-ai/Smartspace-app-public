import { createAuthAdapter } from '@/platform/auth';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    try {
      const auth = createAuthAdapter();
      
      // Give MSAL a moment to process any redirect tokens
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const session = await auth.getSession();
      if (!session) {
        throw redirect({ to: '/login', search: { redirect: location.href } });
      }
    } catch {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
})

