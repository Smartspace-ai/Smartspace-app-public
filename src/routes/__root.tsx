// src/routes/__root.tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'

import AppProviders from '@/app/AppProviders'
import { RootErrorBoundary } from '@/app/ui/RouteErrorEnvelope'

import TeamsLoader from '@/pages/teams_loader'

import { useTeamsViewport } from '@/hooks/useTeamsViewport'

function RootContent() {
  const { viewportHeight, isAndroidTeams } = useTeamsViewport()
  
  return (
    <div 
      className="flex flex-col" 
      style={{ 
        minHeight: viewportHeight,
        ...(isAndroidTeams && {
          height: viewportHeight,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        })
      }}
    >
      <Outlet />
    </div>
  )
}

export default function Root() {
  return (
    <AppProviders>
      <RootContent />
    </AppProviders>
  )
}
// routes/__root.tsx
export const Route = createRootRoute({
  pendingMs: 250,
  pendingComponent: () => <TeamsLoader message="Loading…" />,
  component: Root,
  errorComponent: RootErrorBoundary,
});
