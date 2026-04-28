// src/ui/workspaces/useWorkspaceSubscriptions.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { useWorkspaceRealtime } from '@/platform/realtime/useWorkspaceRealtime';
import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import {
  type Comment,
  commentsKeys,
  mapSignalRCommentSummaryToModel,
} from '@/domains/comments';
import { useThreadMessageStream } from '@/domains/messages';
import { messagesKeys } from '@/domains/messages/queryKeys';
import {
  applyThreadToCache,
  invalidateWorkspaceThreadLists,
  mapSignalRThreadSummaryToModel,
  threadDetailOptions,
} from '@/domains/threads';
import { threadsKeys } from '@/domains/threads/queryKeys';

export function useWorkspaceSubscriptions() {
  // Derive ids from whichever workspace route is active: thread,
  // workspace index, or the bare workspace layout. Matching only the
  // thread route means the SignalR join never fires on the workspace
  // home, so broadcasts reach zero clients for that tab.
  const { workspaceId, threadId } = useRouteIds();
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Only hold the thread SSE open while the thread is actively running.
  // The isFlowRunning flag is flipped optimistically by useSendMessage and
  // canonically by SignalR's receiveThreadUpdate, so the stream opens/closes
  // in sync with real backend state.
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
      // Splice the comment straight into the list cache. The previous handler
      // invalidated `['comments', <threadId>]` which never matched the real
      // key (`['comments', 'list', { threadId }]`), so comments weren't
      // refetched at all on live updates.
      const mapped = mapSignalRCommentSummaryToModel(summary);
      const listKey = commentsKeys.list(summary.messageThreadId);
      let applied = false;
      qc.setQueryData<Comment[]>(listKey, (old) => {
        if (!old) return old;
        applied = true;
        const idx = old.findIndex((c) => c.id === summary.id);
        if (idx === -1) {
          return [...old, mapped].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          );
        }
        const copy = old.slice();
        copy[idx] = mapped;
        return copy;
      });
      // If we've never fetched this thread's comments before, the cache
      // entry doesn't exist yet — fall back to an invalidate so the next
      // observer fetches fresh.
      if (!applied) {
        qc.invalidateQueries({ queryKey: listKey });
      }
    },
  });
}
