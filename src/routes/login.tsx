import { createFileRoute, redirect } from '@tanstack/react-router'

import { createAuthAdapter } from '@/platform/auth'

import { Login } from '@/pages/Login/Login'

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ location }) => {
    try {
      const auth = createAuthAdapter()
      
      // Give MSAL a moment to process any redirect tokens
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const session = await auth.getSession()
      if (session) {
        // Check for stored redirect URL first, then URL params, then default
        const storedRedirect = auth.getStoredRedirectUrl()
        const params = new URLSearchParams(location.search ?? '')
        const target = storedRedirect || params.get('redirect') || '/workspace'
        
        // Clear stored redirect URL after use
        if (storedRedirect) {
          try {
            sessionStorage.removeItem('msalRedirectUrl')
          } catch {
            // Ignore storage errors
          }
        }
        
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

