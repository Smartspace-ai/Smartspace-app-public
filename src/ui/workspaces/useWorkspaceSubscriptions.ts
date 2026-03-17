// src/ui/workspaces/useWorkspaceSubscriptions.ts
import { useQueryClient } from '@tanstack/react-query';
import { useMatch, useNavigate } from '@tanstack/react-router';

import { useWorkspaceRealtime } from '@/platform/realtime/useWorkspaceRealtime';

import { messagesKeys } from '@/domains/messages/queryKeys';
import { threadsKeys } from '@/domains/threads/queryKeys';

export function useWorkspaceSubscriptions() {
  const match = useMatch({ from: '/_protected/workspace/$workspaceId/thread/$threadId', shouldThrow: false });
  const workspaceId = match?.params?.workspaceId;
  const threadId = match?.params?.threadId;
  const qc = useQueryClient();
  const navigate = useNavigate();

  useWorkspaceRealtime(workspaceId, {
    onThreadUpdate: (id) => {
      if (!workspaceId) return;
      qc.invalidateQueries({ queryKey: threadsKeys.list(workspaceId) });
      qc.invalidateQueries({ queryKey: threadsKeys.detail(workspaceId,id) });
      qc.invalidateQueries({ queryKey: messagesKeys.list(id) });
    },
    onThreadDeleted: (id) => {
      if (!workspaceId) return;
      qc.invalidateQueries({ queryKey: threadsKeys.list(workspaceId) });
      if (id === threadId) {
        navigate({ to: '/workspace/$workspaceId', params: { workspaceId } });
      }
    },
    onCommentsUpdate: (tid) => {
      qc.invalidateQueries({ queryKey: ['comments', tid] });
    },
  });
}
