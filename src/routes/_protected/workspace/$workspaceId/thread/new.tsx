import { createFileRoute } from '@tanstack/react-router';

import { PendingThreadsProvider } from '@/ui/threads/PendingThreadsContext';

import ChatBotPage from '@/pages/WorkspaceThreadPage/chat';

export const Route = createFileRoute(
  '/_protected/workspace/$workspaceId/thread/new'
)({
  component: ThreadNewRouteComponent,
});

function ThreadNewRouteComponent() {
  const { workspaceId } = Route.useParams();
  return (
    <PendingThreadsProvider>
      <ChatBotPage workspaceId={workspaceId} threadId="" />
    </PendingThreadsProvider>
  );
}
