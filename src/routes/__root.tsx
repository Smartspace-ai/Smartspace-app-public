// src/routes/__root.tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'

import TeamsLoader from '@/pages/teams_loader'

import AppProviders from '@/app/app'
import { useTeamsViewport } from '@/hooks/use-teams-viewport'

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

export const Route = createRootRoute({
  pendingMs: 0,
  pendingComponent: () => <TeamsLoader message="Loading…" />,
  component: Root,
})
