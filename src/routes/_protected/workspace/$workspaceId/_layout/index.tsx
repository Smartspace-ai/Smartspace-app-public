import { isCancelledError } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { ensureDraftThread, threadsListOptions } from '@/domains/threads';

// routes/_protected/workspace/$workspaceId/index.tsx
export const Route = createFileRoute(
  '/_protected/workspace/$workspaceId/_layout/'
)({
  pendingMs: 0,
  loader: async ({ params, context }) => {
    let list;
    try {
      list = await context.queryClient.ensureQueryData(
        threadsListOptions(params.workspaceId, { take: 1, skip: 0 })
      );
    } catch (e: unknown) {
      // An unrelated mutation (pin/rename/delete) can cancel this exact
      // fetch via its own onMutate cancelling threadsKeys.lists() — that's
      // not evidence the workspace is empty. This route renders nothing
      // either way, so just commit with no redirect and let whichever
      // observer needs the list (e.g. the sidebar) re-fetch it normally,
      // rather than crashing into the error boundary.
      if (isCancelledError(e)) return null;
      throw e;
    }
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
