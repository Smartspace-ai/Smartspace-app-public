import { createFileRoute } from "@tanstack/react-router";

import { queryClient } from '@/platform/reactQueryClient';

import { threadDetailOptions } from '@/domains/threads/queries';
import { isDraftThreadId } from '@/shared/utils/threadId';

import ChatBotPage from "@/pages/WorkspaceThreadPage/chat";
import { RouteIdsProvider } from "@/pages/WorkspaceThreadPage/RouteIdsProvider";

// routes/_protected/workspace/$workspaceId/thread/$threadId.tsx
export const Route = createFileRoute('/_protected/workspace/$workspaceId/thread/$threadId')({
  loader: ({ params }) => {
    // Draft threads are client-side only until a message is sent (or creation succeeds in background).
    // Avoid fetching thread details for draft ids (backend will 404).
    if (isDraftThreadId(params.threadId)) return null;
    return queryClient.ensureQueryData(
      threadDetailOptions({ workspaceId: params.workspaceId, threadId: params.threadId })
    );
  },
  component: () => (
    <RouteIdsProvider>
      <ChatBotPage />
    </RouteIdsProvider>
  ),
});
