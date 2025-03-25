'use client';

import { useWorkspaceThreads } from '@/hooks/use-workspace-threads';
import { addBotResponse, addMessage, fetchMessages } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSmartSpaceChat } from '../contexts/smartspace-context';

export function useWorkspaceMessages() {
  const { activeThread, activeWorkspace } = useSmartSpaceChat();
  const { updateThreadMetadata } = useWorkspaceThreads();
  const queryClient = useQueryClient();

  // Fetch messages for the active thread
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['messages', activeThread?.id],
    queryFn: () =>
      activeThread ? fetchMessages(activeThread.id) : Promise.resolve([]),
    enabled: !!activeThread,
  });

  // Effect to refetch messages when thread changes
  useEffect(() => {
    if (activeThread) {
      console.log(
        'Thread changed, refetching messages for thread ID:',
        activeThread.id
      );
      refetch().catch((error) => {
        console.error('Error refetching messages:', error);
      });
    }
  }, [activeThread, refetch]);

  // Mutation to add a new message
  const addMessageMutation = useMutation({
    mutationFn: ({
      threadId,
      content,
    }: {
      threadId: number;
      content: string;
    }) => addMessage(threadId, content),
    onSuccess: (newMessage) => {
      // Update the messages cache
      queryClient.setQueryData(
        ['messages', newMessage.threadId],
        (oldMessages: typeof messages = []) => [...oldMessages, newMessage]
      );

      // Update the thread's reply count and last activity
      updateThreadMetadata(newMessage.threadId, {
        replies: (activeThread?.replies || 0) + 1,
        lastActivity: 'Just now',
      });

      // Trigger the bot response
      if (activeThread) {
        addBotResponseMutation.mutate({
          threadId: newMessage.threadId,
          threadTitle: activeThread.title,
        });
      }
    },
  });

  // Mutation to add a bot response
  const addBotResponseMutation = useMutation({
    mutationFn: ({
      threadId,
      threadTitle,
    }: {
      threadId: number;
      threadTitle: string;
    }) => addBotResponse(threadId, threadTitle),
    onSuccess: (botResponse) => {
      // Update the messages cache
      queryClient.setQueryData(
        ['messages', botResponse.threadId],
        (oldMessages: typeof messages = []) => [...oldMessages, botResponse]
      );

      // Update the thread's reply count and last activity
      updateThreadMetadata(botResponse.threadId, {
        replies: (activeThread?.replies || 0) + 1,
        lastActivity: 'Just now',
      });
    },
  });

  // Function to send a new message
  const sendMessage = (content: string) => {
    if (!activeThread || !content.trim()) return;

    addMessageMutation.mutate({
      threadId: activeThread.id,
      content,
    });
  };

  return {
    messages,
    isLoading,
    error,
    refetch,
    sendMessage,
    isSendingMessage: addMessageMutation.isPending,
    isBotResponding: addBotResponseMutation.isPending,
  };
}
