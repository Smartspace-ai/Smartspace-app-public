// src/ui/workspaces/useWorkspaceSubscriptions.ts
import { useQueryClient } from '@tanstack/react-query';
import { useMatch, useNavigate } from '@tanstack/react-router';

import { useWorkspaceRealtime } from '@/platform/realtime/useWorkspaceRealtime';

import { messagesKeys } from '@/domains/messages/queryKeys';
import { threadsKeys } from '@/domains/threads/queryKeys';

export function useWorkspaceSubscriptions() {
  const match = useMatch({
    from: '/_protected/workspace/$workspaceId/_layout/thread/$threadId',
    shouldThrow: false,
  });
  const workspaceId = match?.params?.workspaceId;
  const threadId = match?.params?.threadId;
  const qc = useQueryClient();
  const navigate = useNavigate();

  useWorkspaceRealtime(workspaceId, {
    onThreadUpdate: (thread) => {
      if (!workspaceId) return;
      // eslint-disable-next-line no-console
      console.log('[SignalR] ReceiveThreadUpdate for thread:', thread.id);
      qc.invalidateQueries({ queryKey: threadsKeys.list(workspaceId) });
      qc.invalidateQueries({
        queryKey: threadsKeys.detail(workspaceId, thread.id),
      });
      qc.invalidateQueries({ queryKey: messagesKeys.list(thread.id) });
    },
    onThreadDeleted: (thread) => {
      if (!workspaceId) return;
      qc.invalidateQueries({ queryKey: threadsKeys.list(workspaceId) });
      if (thread.id === threadId) {
        navigate({ to: '/workspace/$workspaceId', params: { workspaceId } });
      }
    },
    onCommentsUpdate: (comment) => {
      qc.invalidateQueries({
        queryKey: ['comments', comment.messageThreadId],
      });
    },
  });
}
