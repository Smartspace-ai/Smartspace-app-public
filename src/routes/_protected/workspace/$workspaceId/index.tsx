import ChatBotPage from '@/pages/WorkspaceThreadPage/chat'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/workspace/$workspaceId/')({
  component: () => {
    return <ChatBotPage />
  },
})


