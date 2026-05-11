import { createFileRoute, redirect } from '@tanstack/react-router';

import { ensureDraftThread, threadsListOptions } from '@/domains/threads';

// routes/_protected/workspace/$workspaceId/index.tsx
export const Route = createFileRoute(
  '/_protected/workspace/$workspaceId/_layout/'
)({
  pendingMs: 0,
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
    // No threads — auto-create a draft thread so the user lands in a ready-to-chat state.
    const { draftId } = ensureDraftThread(
      params.workspaceId,
      context.queryClient
    );
    throw redirect({
      to: '/workspace/$workspaceId/thread/$threadId',
      params: { workspaceId: params.workspaceId, threadId: draftId },
      replace: true,
    });
  },
  component: () => null,
});
