import { createFileRoute, redirect } from '@tanstack/react-router';

import { threadsListOptions } from '@/domains/threads/queries';

import ChatBotPage from '@/pages/WorkspaceThreadPage/chat';

// routes/_protected/workspace/$workspaceId/index.tsx
export const Route = createFileRoute('/_protected/workspace/$workspaceId/')({
  pendingMs: 0,
  pendingComponent: WorkspaceIndexRouteComponent,
  loader: async ({ params, context }) => {
    const list = await context.queryClient.ensureQueryData(
      threadsListOptions(params.workspaceId, { take: 1, skip: 0 })
    );
    const first = list.data[0];
    if (first?.id) {
      throw redirect({
        to: '/workspace/$workspaceId/thread/$threadId',
        params: { workspaceId: params.workspaceId, threadId: first.id },
        replace: true,
      });
    }
    return null;
  },
  component: WorkspaceIndexRouteComponent,
});

function WorkspaceIndexRouteComponent() {
  const { workspaceId } = Route.useParams();
  return <ChatBotPage workspaceId={workspaceId} threadId="" />;
}
