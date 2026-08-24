// src/platform/realtime/useWorkspaceRealtime.ts
import { SignalR } from '@smartspace/api-client';
import { useEffect, useRef } from 'react';

import { useOptionalRealtime } from './RealtimeProvider';

// Thread events are tolerant of both wire shapes permanently: new backends
// send an id-only ThreadEvent ({ workSpaceId, threadId }); older ones a full
// MessageThreadSummary ({ id, ... }). The widened handler type keeps this
// compiling on both sides of the api-client bump.
type ThreadEventPayload = { threadId?: string; id?: string };

type Handlers = {
  onNotification?: (notification: SignalR.Notification) => void;
  onThreadUpdate?: (threadEvent: ThreadEventPayload) => void;
  onThreadDeleted?: (threadEvent: ThreadEventPayload) => void;
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

  // Dispatch via ref so the effect below doesn't depend on `handlers`
  // identity, which changes every render and would otherwise cause the
  // SignalR group to be left and rejoined on every render.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

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
          /* legacy JSON-string channel — superseded by receiveNotification,
             still pushed by the server for clients that haven't migrated */
        },
        receiveNotification: async (notification) => {
          handlersRef.current.onNotification?.(notification);
        },
        receiveThreadUpdate: async (thread) => {
          handlersRef.current.onThreadUpdate?.(thread);
        },
        receiveThreadDeleted: async (thread) => {
          handlersRef.current.onThreadDeleted?.(thread);
        },
        receiveCommentsUpdate: async (comment) => {
          handlersRef.current.onCommentsUpdate?.(comment);
        },
      }
    );

    return () => {
      unsubscribeFromGroup(workspaceId);
      subscription.dispose();
    };
  }, [workspaceId, connection, subscribeToGroup, unsubscribeFromGroup]);
}
