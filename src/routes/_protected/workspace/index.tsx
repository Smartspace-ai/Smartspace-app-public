// src/routes/_protected/workspace/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

import { queryClient } from '@/platform/reactQueryClient'

import { workspacesListOptions } from '@/domains/workspaces/queries'

export const Route = createFileRoute('/_protected/workspace/')({
  // No component; this route always redirects
  loader: async () => {
    const list = await queryClient.ensureQueryData(workspacesListOptions())
    if (list?.length) {
      throw redirect({
        to: '/workspace/$workspaceId',
        params: { workspaceId: list[0].id },
      })
    } else {
      throw redirect({ to: '/workspace/no-workspaces' })
    }
  },
})
