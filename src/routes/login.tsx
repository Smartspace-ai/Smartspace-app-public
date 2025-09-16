import { Login } from '@/pages/Login/Login'
import { createAuthAdapter } from '@/platform/auth'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ location }) => {
    try {
      const auth = createAuthAdapter()
      
      // Give MSAL a moment to process any redirect tokens
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const session = await auth.getSession()
      if (session) {
        const params = new URLSearchParams(location.search ?? '')
        const target = params.get('redirect') || '/workspace'
        throw redirect({ to: target })
      }
    } catch {
      // No session, continue to login page
    }
  },
  component: LoginRoute,
})

function LoginRoute() {
  return <Login />;
}

