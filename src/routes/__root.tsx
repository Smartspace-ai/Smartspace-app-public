// src/routes/__root.tsx
import AppProviders from '@/app/app'
import TeamsLoader from '@/pages/teams_loader'
import { Outlet, createRootRoute } from '@tanstack/react-router'

export default function Root() {
  return (
    <AppProviders>
      <div className="min-h-screen flex flex-col">
        <Outlet />
      </div>
    </AppProviders>
  )
}

export const Route = createRootRoute({
  pendingMs: 0,
  pendingComponent: () => <TeamsLoader message="Loading…" />,
  component: Root,
})
