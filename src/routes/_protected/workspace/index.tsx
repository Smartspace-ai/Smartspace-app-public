import ChatBotPage from '@/pages/chat'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/workspace/')({
  component: WorkspaceIndex,
})

function WorkspaceIndex() {
  // Render the same Chat UI without a workspaceId; child components handle empty/loading states
  return <ChatBotPage />
}


