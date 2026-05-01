// src/platform/realtime/useWorkspaceRealtime.ts
import { SignalR } from '@smartspace/api-client';
import { useEffect } from 'react';

import { useOptionalRealtime } from './RealtimeProvider';

type Handlers = {
  onThreadUpdate?: (thread: SignalR.MessageThreadSummary) => void;
  onThreadDeleted?: (thread: SignalR.MessageThreadSummary) => void;
  onCommentsUpdate?: (comment: SignalR.CommentSummary) => void;
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

    const subscription = SignalR.getReceiverRegister('IChatReceiver').register(
      connection,
      {
        receiveMessage: async () => {
          /* no-op: toast/notification handling lives elsewhere */
        },
        receiveThreadUpdate: async (thread) => {
          handlers.onThreadUpdate?.(thread);
        },
        receiveThreadDeleted: async (thread) => {
          handlers.onThreadDeleted?.(thread);
        },
        receiveCommentsUpdate: async (comment) => {
          handlers.onCommentsUpdate?.(comment);
        },
      }
    );

    return () => {
      unsubscribeFromGroup(workspaceId);
      subscription.dispose();
    };
  }, [
    workspaceId,
    connection,
    subscribeToGroup,
    unsubscribeFromGroup,
    handlers,
  ]);
}
