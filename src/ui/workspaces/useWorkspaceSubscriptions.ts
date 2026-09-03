// src/ui/workspaces/useWorkspaceSubscriptions.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMatch, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useUserId } from '@/platform/auth/session';
import { defaultChatService } from '@/platform/chat/defaultChatService';
import { useOptionalRealtime } from '@/platform/realtime/RealtimeProvider';
import { useWorkspaceRealtime } from '@/platform/realtime/useWorkspaceRealtime';

import { applyCommentToCache, commentsKeys } from '@/domains/comments';
import { useThreadMessageStream } from '@/domains/messages/threadStream';
import { notificationsKeys } from '@/domains/notifications';

import { isDraftThreadId } from '@/shared/utils/threadId';

import { threadDetailOptions } from '@smartspace/chat-ui';

import { handleThreadDeleted, handleThreadUpdate } from './threadEvents';

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
  // A draft thread is client-only until the first message — fetching its
  // detail always 404s, and since this query shares its cache entry with
  // useThread's (same key), that error bleeds into every observer of the
  // key, including useThread's own draft-aware one. Skip fetching here too.
  const { data: thread } = useQuery({
    ...threadDetailOptions({
      service,
      workspaceId: workspaceId || '',
      threadId: threadId || '',
    }),
    enabled: !!workspaceId && !!threadId && !isDraftThreadId(threadId),
  });
  useThreadMessageStream(threadId || undefined, !!thread?.isFlowRunning);

  // User-targeted pushes (ReceiveNotification / legacy ReceiveMessage) go to
  // a SignalR group named after the user's id, and the hub has no automatic
  // membership — clients must join explicitly (the admin app does the same
  // right after connecting). Without this join, notification pushes never
  // reach this client at all. subscribeToGroup records the group as desired,
  // so the provider re-joins it after reconnects.
  const userId = useUserId();
  const realtime = useOptionalRealtime();
  const subscribeToGroup = realtime?.subscribeToGroup;
  const unsubscribeFromGroup = realtime?.unsubscribeFromGroup;
  useEffect(() => {
    if (!userId || !subscribeToGroup || !unsubscribeFromGroup) return;
    subscribeToGroup(userId);
    return () => {
      unsubscribeFromGroup(userId);
    };
  }, [userId, subscribeToGroup, unsubscribeFromGroup]);

  useWorkspaceRealtime(workspaceId || undefined, {
    // The server pushes a user-targeted notification for every persisted
    // notification (added to thread, comment reply, ...). The payload
    // duplicates what GET /notification returns, so refetch rather than
    // trusting a second write path into the cache.
    onNotification: () => {
      qc.invalidateQueries({ queryKey: notificationsKeys.all });
    },
    // SignalR remains the safety net for the SSE: the SSE `thread` frame is
    // the preferred source of truth for the viewed thread but doesn't always
    // deliver terminally (dropped connection, stale summary when the DB
    // write lags Redis). The detail invalidation in handleThreadUpdate
    // refetches post-release state, so a stuck `isFlowRunning: true` still
    // clears without a tab refresh. There is a small race window where the
    // refetched `isFlowRunning: false` paints before the SSE delivers the
    // final message frame — recoverable on the next frame, unlike a stuck
    // `true`.
    onThreadUpdate: (threadEvent) => {
      if (!workspaceId) return;
      handleThreadUpdate(qc, workspaceId, threadId, threadEvent);
    },
    onThreadDeleted: (threadEvent) => {
      if (!workspaceId) return;
      if (handleThreadDeleted(qc, workspaceId, threadId, threadEvent)) {
        // replace: true so the deleted thread's URL isn't left in history,
        // reachable via Back after it's gone from the cache.
        navigate({
          to: '/workspace/$workspaceId',
          params: { workspaceId },
          replace: true,
        });
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
