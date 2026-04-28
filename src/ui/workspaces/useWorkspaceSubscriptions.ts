// src/ui/workspaces/useWorkspaceSubscriptions.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { useWorkspaceRealtime } from '@/platform/realtime/useWorkspaceRealtime';
import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { applyCommentToCache, commentsKeys } from '@/domains/comments';
import { messagesKeys, useThreadMessageStream } from '@/domains/messages';
import {
  applyThreadToCache,
  invalidateWorkspaceThreadLists,
  mapSignalRThreadSummaryToModel,
  threadDetailOptions,
  threadsKeys,
} from '@/domains/threads';

export function useWorkspaceSubscriptions() {
  // Derive ids from whichever workspace route is active: thread,
  // workspace index, or the bare workspace layout. Matching only the
  // thread route means the SignalR join never fires on the workspace
  // home, so broadcasts reach zero clients for that tab.
  const { workspaceId, threadId } = useRouteIds();
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Only hold the thread SSE open while the thread is actively running.
  // `thread.isFlowRunning` is set by the initial detail GET, by SignalR's
  // receiveThreadUpdate, by the SSE's own thread frame, and (after a
  // successful POST /messages) by useSendMessage — that last write is
  // post-server-confirmation so the gate doesn't open against a flow the
  // backend hasn't actually started yet.
  const { data: thread } = useQuery({
    ...threadDetailOptions({
      workspaceId: workspaceId || '',
      threadId: threadId || '',
    }),
    enabled: !!workspaceId && !!threadId,
  });
  useThreadMessageStream(threadId || undefined, !!thread?.isFlowRunning);

  useWorkspaceRealtime(workspaceId || undefined, {
    onThreadUpdate: (summary) => {
      if (!workspaceId) return;
      // eslint-disable-next-line no-console
      console.log('[SignalR] ReceiveThreadUpdate for thread:', summary.id);

      // SignalR is now a hint: the SSE's `thread` frame is authoritative for
      // `isFlowRunning` on the thread the user is viewing. For other threads
      // (no SSE open), SignalR still drives sidebar state — the direct cache
      // write makes that instant regardless.
      const foundInList = applyThreadToCache(
        qc,
        mapSignalRThreadSummaryToModel(summary)
      );
      if (!foundInList) invalidateWorkspaceThreadLists(qc, workspaceId);

      // Mark messages stale for threads the user isn't actively viewing;
      // the thread SSE handles the one they are viewing.
      qc.invalidateQueries({ queryKey: messagesKeys.list(summary.id) });
    },
    onThreadDeleted: (summary) => {
      if (!workspaceId) return;
      qc.invalidateQueries({ queryKey: threadsKeys.list(workspaceId) });
      if (summary.id === threadId) {
        navigate({ to: '/workspace/$workspaceId', params: { workspaceId } });
      }
    },
    onCommentsUpdate: (summary) => {
      // The previous handler invalidated `['comments', <threadId>]` which
      // never matched the real key (`['comments', 'list', { threadId }]`),
      // so comments weren't refetched at all on live updates. Splice
      // straight into the list cache via the shared helper, and fall back
      // to invalidate when the user has never opened the comments panel
      // (no cache entry to patch).
      const applied = applyCommentToCache(qc, summary);
      if (!applied) {
        qc.invalidateQueries({
          queryKey: commentsKeys.list(summary.messageThreadId),
        });
      }
    },
  });
}
