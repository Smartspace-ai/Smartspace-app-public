import { createFileRoute } from '@tanstack/react-router'

import ChatBotPage from '@/pages/WorkspaceThreadPage/chat'
import { RouteIdsProvider } from '@/pages/WorkspaceThreadPage/RouteIdsProvider'

export const Route = createFileRoute(
  '/_protected/workspace/$workspaceId/thread/$threadId',
)({
  component: () => {
    return (
      <RouteIdsProvider>
        <ChatBotPage />
      </RouteIdsProvider>
    )
  },
})


