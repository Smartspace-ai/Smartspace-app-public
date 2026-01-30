import { createFileRoute, redirect } from '@tanstack/react-router';

import { queryClient } from '@/platform/reactQueryClient';
import { RouteIdsProvider } from '@/platform/routing/RouteIdsProvider';

import {
  threadDetailOptions,
  threadsListOptions,
} from '@/domains/threads/queries';
import { threadsKeys } from '@/domains/threads/queryKeys';

import ChatBotPage from '@/pages/WorkspaceThreadPage/chat';

import { isDraftThreadId, unmarkDraftThreadId } from '@/shared/utils/threadId';

// routes/_protected/workspace/$workspaceId/thread/$threadId.tsx
export const Route = createFileRoute(
  '/_protected/workspace/$workspaceId/thread/$threadId'
)({
  pendingMs: 0,
  pendingComponent: ThreadRoutePending,
  loader: async ({ params }) => {
    // Draft threads are client-side only until a message is sent (or creation succeeds in background).
    // Avoid fetching thread details for active draft ids, but ignore stale ones from sessionStorage.
    if (isDraftThreadId(params.threadId)) {
      const cachedDraft = queryClient.getQueryData(
        threadsKeys.detail(params.workspaceId, params.threadId)
      );
      if (cachedDraft) return null;
      unmarkDraftThreadId(params.threadId);
    }

    try {
      return await queryClient.ensureQueryData(
        threadDetailOptions({
          workspaceId: params.workspaceId,
          threadId: params.threadId,
        })
      );
    } catch (e: unknown) {
      // If user deep-links to a random GUID that doesn't exist, redirect to the first thread
      // (same behavior as /workspace/$workspaceId/ without a threadId).
      const err =
        e && typeof e === 'object' ? (e as Record<string, unknown>) : null;
      if (err?.type !== 'NotFound') throw e;

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

      throw redirect({
        to: '/workspace/$workspaceId',
        params: { workspaceId: params.workspaceId },
        replace: true,
      });
    }
  },
  component: ThreadRouteComponent,
});

function ThreadRoutePending() {
  // Avoid mounting chat UI while loader resolves/redirects.
  return null;
}

function ThreadRouteComponent() {
  const { workspaceId, threadId } = Route.useParams();
  return (
    <RouteIdsProvider>
      <ChatBotPage workspaceId={workspaceId} threadId={threadId} />
    </RouteIdsProvider>
  );
}
