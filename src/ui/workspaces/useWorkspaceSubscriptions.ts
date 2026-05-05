// src/ui/workspaces/useWorkspaceSubscriptions.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { useWorkspaceRealtime } from '@/platform/realtime/useWorkspaceRealtime';
import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { applyCommentToCache, commentsKeys } from '@/domains/comments';
import { useThreadMessageStream } from '@/domains/messages/threadStream';

import {
  applyThreadToCache,
  invalidateWorkspaceThreadLists,
  mapSignalRThreadSummaryToModel,
  messagesKeys,
  threadDetailOptions,
  threadsKeys,
  useChatService,
} from '@smartspace/chat-ui';

export function useWorkspaceSubscriptions() {
  // Derive ids from whichever workspace route is active: thread,
  // workspace index, or the bare workspace layout. Matching only the
  // thread route means the SignalR join never fires on the workspace
  // home, so broadcasts reach zero clients for that tab.
  const { workspaceId, threadId } = useRouteIds();
  const service = useChatService();
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
      service,
      workspaceId: workspaceId || '',
      threadId: threadId || '',
    }),
    enabled: !!workspaceId && !!threadId,
  });
  useThreadMessageStream(threadId || undefined, !!thread?.isFlowRunning);

  useWorkspaceRealtime(workspaceId || undefined, {
    onThreadUpdate: (summary) => {
      if (!workspaceId) return;

      // SignalR is the safety net: the SSE `thread` frame is the preferred
      // source of truth for the viewed thread, but the SSE doesn't always
      // deliver a terminal thread summary (the connection can drop or the
      // backend can return a stale summary if its DB write lags Redis), so
      // we always apply SignalR's update to the detail cache. There is a
      // small race window where SignalR's `isFlowRunning: false` paints
      // before the SSE has delivered the final message frame — visible as a
      // brief moment with no typing indicator and no response yet — but
      // that's recoverable on the next frame, whereas a stuck `true` here
      // requires the user to refresh the tab.
      const foundInList = applyThreadToCache(
        qc,
        mapSignalRThreadSummaryToModel(summary)
      );
      if (!foundInList) invalidateWorkspaceThreadLists(qc, workspaceId);

      // Refetch the messages list so other-tab activity surfaces — but
      // only for threads the user is NOT currently viewing. The viewed
      // thread is fed by its own SSE (snapshot + deltas + terminal frame)
      // which is already authoritative; invalidating its cache here races
      // a server fetch against the SSE's final state and produces a
      // visible flicker the moment the flow finishes.
      if (summary.id !== threadId) {
        qc.invalidateQueries({ queryKey: messagesKeys.list(summary.id) });
      }
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
