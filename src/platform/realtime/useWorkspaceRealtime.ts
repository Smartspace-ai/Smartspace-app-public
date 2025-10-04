// src/platform/realtime/useWorkspaceRealtime.ts
import { useEffect } from 'react';

import { useRealtime } from './RealtimeProvider';

type Handlers = {
  onThreadUpdate?: (threadId: string) => void;
  onThreadDeleted?: (threadId: string) => void;
  onCommentsUpdate?: (threadId: string) => void;
};

export function useWorkspaceRealtime(workspaceId?: string, handlers: Handlers = {}) {
  const { connection, subscribeToGroup, unsubscribeFromGroup } = useRealtime();

  useEffect(() => {
    if (!workspaceId || !connection) return;

    // join workspace group
    subscribeToGroup(workspaceId);

    const onThreadUpdate = (t: { id: string }) => handlers.onThreadUpdate?.(t.id);
    const onThreadDeleted = (t: { id: string }) => handlers.onThreadDeleted?.(t.id);
    const onCommentsUpdate = (c: { messageThreadId: string }) => handlers.onCommentsUpdate?.(c.messageThreadId);

    connection.on('ReceiveThreadUpdate', onThreadUpdate);
    connection.on('ReceiveThreadDeleted', onThreadDeleted);
    connection.on('ReceiveCommentsUpdate', onCommentsUpdate);

    return () => {
      unsubscribeFromGroup(workspaceId);
      connection.off('ReceiveThreadUpdate', onThreadUpdate);
      connection.off('ReceiveThreadDeleted', onThreadDeleted);
      connection.off('ReceiveCommentsUpdate', onCommentsUpdate);
    };
  }, [workspaceId, connection, subscribeToGroup, unsubscribeFromGroup, handlers]);
}
