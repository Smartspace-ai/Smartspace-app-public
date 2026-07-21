// src/ui/workspaces/useWorkspaceSubscriptions.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMatch, useNavigate } from '@tanstack/react-router';

import { defaultChatService } from '@/platform/chat/defaultChatService';
import { useWorkspaceRealtime } from '@/platform/realtime/useWorkspaceRealtime';

import { applyCommentToCache, commentsKeys } from '@/domains/comments';
import { useThreadMessageStream } from '@/domains/messages/threadStream';
import { notificationsKeys } from '@/domains/notifications';

import {
  applyThreadToCache,
  invalidateWorkspaceThreadLists,
  mapSignalRThreadSummaryToModel,
  messagesKeys,
  threadDetailOptions,
  threadsKeys,
} from '@smartspace/chat-ui';

// Mounted at the auth layout (`_protected.tsx`) so SignalR persists across
// workspace switches. Reads ids directly via `useMatch` (rather than
// `useRouteIds`) so the hook can sit above the workspace layout where the
// provider isn't mounted, and gracefully no-ops on non-workspace routes
// like `/workspace`. Uses the singleton `defaultChatService` directly
// because `ChatProvider` only mounts under the workspace layout.
export function useWorkspaceSubscriptions() {
  const threadMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/_layout/thread/$threadId',
    shouldThrow: false,
  });
  const workspaceIndexMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/_layout/',
    shouldThrow: false,
  });
  const workspaceLayoutMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/_layout',
    shouldThrow: false,
  });
  const workspaceId =
    threadMatch?.params?.workspaceId ??
    workspaceIndexMatch?.params?.workspaceId ??
    workspaceLayoutMatch?.params?.workspaceId ??
    '';
  const threadId = threadMatch?.params?.threadId ?? '';
  const service = defaultChatService;
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
    // The server pushes a user-targeted notification for every persisted
    // notification (added to thread, comment reply, ...). The payload
    // duplicates what GET /notification returns, so refetch rather than
    // trusting a second write path into the cache.
    onNotification: () => {
      qc.invalidateQueries({ queryKey: notificationsKeys.all });
    },
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
