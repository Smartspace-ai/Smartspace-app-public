import { createFileRoute } from "@tanstack/react-router";

import { queryClient } from '@/platform/reactQueryClient';

import { threadDetailOptions } from '@/domains/threads/queries';

import ChatBotPage from "@/pages/WorkspaceThreadPage/chat";
import { RouteIdsProvider } from "@/pages/WorkspaceThreadPage/RouteIdsProvider";

// routes/_protected/workspace/$workspaceId/thread/$threadId.tsx
export const Route = createFileRoute('/_protected/workspace/$workspaceId/thread/$threadId')({
  loader: ({ params }) =>
    queryClient.ensureQueryData(threadDetailOptions({ workspaceId: params.workspaceId, threadId: params.threadId })),
  component: () => (
    <RouteIdsProvider>
      <ChatBotPage />
    </RouteIdsProvider>
  ),
});
