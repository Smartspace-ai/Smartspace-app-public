import { msalInstance } from '@/auth/msalClient'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    // Allow render when embedded (e.g., inside Microsoft Teams)
    const isEmbedded = window.self !== window.top

    const active = msalInstance.getActiveAccount()
    const accounts = msalInstance.getAllAccounts()
    const isAuthenticated = !!active || accounts.length > 0

    if (!isAuthenticated && !isEmbedded) {
      const path = location.pathname && location.pathname !== '/' ? location.pathname : '/workspace'
      throw redirect({ to: '/login', search: { redirect: path } })
    }
  },
  component: () => <Outlet />,
})

