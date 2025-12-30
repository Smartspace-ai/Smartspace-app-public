import { createFileRoute, redirect } from "@tanstack/react-router";

import { queryClient } from '@/platform/reactQueryClient';

import { threadsListOptions } from '@/domains/threads/queries';

import ChatBotPage from "@/pages/WorkspaceThreadPage/chat";
import { RouteIdsProvider } from "@/pages/WorkspaceThreadPage/RouteIdsProvider";

// routes/_protected/workspace/$workspaceId/index.tsx
export const Route = createFileRoute('/_protected/workspace/$workspaceId/')({
  pendingMs: 0,
  pendingComponent: () => (
    <RouteIdsProvider>
      <ChatBotPage />
    </RouteIdsProvider>
  ),
  loader: async ({ params }) => {
    // Only fetch the first thread to decide where to redirect.
    // This keeps workspace switching snappy even for large workspaces.
    const list = await queryClient.ensureQueryData(
      threadsListOptions(params.workspaceId, { take: 1, skip: 0 })
    );
    const first = Array.isArray(list)
      ? (list[0] as { id?: string })
      : (list as { data?: { id?: string }[] } | undefined)?.data?.[0];
    if (first?.id) {
      throw redirect({
        to: '/workspace/$workspaceId/thread/$threadId',
        params: { workspaceId: params.workspaceId, threadId: first.id },
        replace: true,
      });
    }
    return null;
  },
  component: () => (
    <RouteIdsProvider>
      <ChatBotPage />
    </RouteIdsProvider>
  ),
});

