import { msalInstance } from '@/auth/msalClient'
import Login from '@/pages/Login/Login'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ location }) => {
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length > 0) {
      const params = new URLSearchParams(location.search ?? '')
      const target = params.get('redirect') || '/workspace'
      throw redirect({ to: target })
    }
  },
  component: () => <Login />,
})

