// src/routes/__root.tsx
import AppProviders from '@/app/app'
import AuthProvider from '@/contexts/auth-context'
import TeamsLoader from '@/pages/teams_loader'
import { Outlet, createRootRoute } from '@tanstack/react-router'

export default function Root() {
  return (
    <AppProviders>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Outlet />
        </div>
      </AuthProvider>
    </AppProviders>
  )
}

export const Route = createRootRoute({
  pendingMs: 0,
  pendingComponent: () => <TeamsLoader message="Loading…" />,
  component: Root,
})
