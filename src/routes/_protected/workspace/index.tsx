import { useWorkspaces } from '@/hooks/use-workspaces'
import NoWorkspacesAvailable from '@/pages/no_workspaces_available'
import TeamsLoader from '@/pages/teams_loader'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_protected/workspace/')({
  component: WorkspaceIndex,
})

function WorkspaceIndex() {
  const navigate = useNavigate()
  const { workspaces, isLoading, isFetched, canQuery } = useWorkspaces()

  useEffect(() => {
    if (isLoading) return
    if (workspaces && (workspaces.length ?? 0) > 0) {
      navigate({
        to: '/workspace/$workspaceId',
        params: { workspaceId: workspaces[0]?.id },
        replace: true,
      })
    }
  }, [isLoading, workspaces, navigate])

  if (isLoading) {
    return <TeamsLoader message="Loading workspaces…" />
  }

  if (canQuery && isFetched && workspaces && (workspaces.length ?? 0) === 0) {
    return <NoWorkspacesAvailable />
  }

  // Fallback while navigating to the first workspace
  return <TeamsLoader message="Loading workspaces…" />
}


