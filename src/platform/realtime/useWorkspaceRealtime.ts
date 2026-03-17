// src/platform/realtime/useWorkspaceRealtime.ts
import { useEffect } from 'react';

import { useOptionalRealtime } from './RealtimeProvider';

type Handlers = {
  onThreadUpdate?: (threadId: string) => void;
  onThreadDeleted?: (threadId: string) => void;
  onCommentsUpdate?: (threadId: string) => void;
};

export function useWorkspaceRealtime(
  workspaceId?: string,
  handlers: Handlers = {}
) {
  const ctx = useOptionalRealtime();
  const connection = ctx?.connection;
  const subscribeToGroup = ctx?.subscribeToGroup;
  const unsubscribeFromGroup = ctx?.unsubscribeFromGroup;

  useEffect(() => {
    if (
      !workspaceId ||
      !connection ||
      !subscribeToGroup ||
      !unsubscribeFromGroup
    )
      return;

    // join workspace group
    subscribeToGroup(workspaceId);

    const onThreadUpdate = (t: { id: string } & Record<string, unknown>) => {
      handlers.onThreadUpdate?.(t.id);
    };
    const onThreadDeleted = (t: { id: string } & Record<string, unknown>) => {
      handlers.onThreadDeleted?.(t.id);
    };
    const onCommentsUpdate = (
      c: { messageThreadId: string } & Record<string, unknown>
    ) => {
      handlers.onCommentsUpdate?.(c.messageThreadId);
    };

    connection.on('ReceiveThreadUpdate', onThreadUpdate);
    connection.on('ReceiveThreadDeleted', onThreadDeleted);
    connection.on('ReceiveCommentsUpdate', onCommentsUpdate);

    return () => {
      unsubscribeFromGroup(workspaceId);
      connection.off('ReceiveThreadUpdate', onThreadUpdate);
      connection.off('ReceiveThreadDeleted', onThreadDeleted);
      connection.off('ReceiveCommentsUpdate', onCommentsUpdate);
    };
  }, [
    workspaceId,
    connection,
    subscribeToGroup,
    unsubscribeFromGroup,
    handlers,
  ]);
}
