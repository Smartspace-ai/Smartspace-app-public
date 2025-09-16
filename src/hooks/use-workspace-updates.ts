import { Comment } from '@/domains/comments/schemas';
import { messagesKeys } from '@/domains/messages/queryKeys';
import { MessageThread } from '@/domains/threads/schemas';
import { useQueryClient } from '@tanstack/react-query';
import { useMatch, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useSignalR } from './use-signalr';

export function useWorkspaceUpdates() {
  const { connection, joinGroup, leaveGroup } = useSignalR();
  const queryClient = useQueryClient();
  const threadMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/thread/$threadId',
    shouldThrow: false,
  });
  const workspaceId = threadMatch?.params?.workspaceId;
  const threadId = threadMatch?.params?.threadId;
  const navigate = useNavigate();
  // Join/leave workspace SignalR group
  useEffect(() => {
    if (!workspaceId || !connection) return;

    const group = `${workspaceId}`;

    joinGroup?.(group).catch((e) =>
      console.error('join workspace group failed', group, e)
    );

    return () => {
      leaveGroup?.(group).catch((e) =>
        console.error('leave workspace group failed', group, e)
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
        queryKey: ['workspace', workspaceId, 'thread', threadId],
      });
      queryClient.invalidateQueries({
        queryKey: ['threads', thread.id],
      });
      queryClient.invalidateQueries({ queryKey: messagesKeys.list(thread.id) });
    };

    const commentsHandler = (comment: Comment) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', comment.messageThreadId],
      });
    };

    const threadDeletedHandler = (thread: MessageThread) => {
      queryClient.invalidateQueries({
        queryKey: ['threads', workspaceId],
      });
      if (thread.id === threadId) {
        navigate({
          to: '/workspace/$workspaceId',
          params: {
            workspaceId: workspaceId,
          },
        });
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
