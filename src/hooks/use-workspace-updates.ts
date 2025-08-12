import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useSignalR } from './use-signalr';
import { MessageThread } from '../models/message-thread';
import { MessageComment } from '../models/message-comment';

export function useWorkspaceUpdates() {
  const { connection, joinGroup, leaveGroup } = useSignalR();
  const queryClient = useQueryClient();
  const { workspaceId, threadId } = useParams();
  const navigate = useNavigate();
  // Join/leave workspace SignalR group
  useEffect(() => {
    if (!workspaceId || !connection) return;

    const group = `${workspaceId}`;

    joinGroup?.(group).catch((e) =>
      console.error('join workspace group failed', group, e),
    );

    return () => {
      leaveGroup?.(group).catch((e) =>
        console.error('leave workspace group failed', group, e),
      );
    };
  }, [workspaceId, connection, joinGroup, leaveGroup]);

  // Register handlers for thread and comments updates
  useEffect(() => {
    if (!connection || !workspaceId) return;

    const threadUpdateHandler = (thread: MessageThread) => {
      queryClient.invalidateQueries({
        queryKey: ['threads', workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ['threads', thread.id],
      });
      queryClient.invalidateQueries({ queryKey: ['messages', thread.id] });
    };

    const commentsHandler = (comment: MessageComment) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', comment.messageThreadId],
      });
    };

    const threadDeletedHandler = (thread: MessageThread) => {
      queryClient.invalidateQueries({
        queryKey: ['threads', workspaceId],
      });
      if (thread.id === threadId) {
        navigate(`/workspaces/${workspaceId}`);
      }
    };

    connection.on('ReceiveThreadUpdate', threadUpdateHandler);
    connection.on('ReceiveCommentsUpdate', commentsHandler);
    connection.on('ReceiveThreadDeleted', threadDeletedHandler);

    return () => {
      connection.off('ReceiveThreadUpdate', threadUpdateHandler);
      connection.off('ReceiveCommentsUpdate', commentsHandler);
      connection.off('ReceiveThreadDeleted', threadDeletedHandler);
    };
  }, [connection, workspaceId, threadId, queryClient, navigate]);
}
