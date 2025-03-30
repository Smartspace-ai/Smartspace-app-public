'use client';

import { addMessage, fetchMessages } from '@/apis/messages';
import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Message } from '../models/message';
import { MessageThread } from '../models/message-threads';
import { Workspace } from '../models/workspace';

export function useWorkspaceMessages(
  passedWorkspace?: Workspace | null,
  passedThread?: MessageThread | null
) {
  const context = useSmartSpaceChat();

  const activeThread = passedThread ?? context?.activeThread;
  const activeWorkspace = passedWorkspace ?? context?.activeWorkspace;

  const queryClient = useQueryClient();

  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<Message[], Error>({
    queryKey: ['messages', activeThread?.id],
    queryFn: async () => {
      if (!activeThread || activeThread.id === 'new') return [];
      const result = await fetchMessages(activeThread.id);
      return result.reverse();
    },
    enabled: !!activeThread,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const postMessageMutation = useMutation<
    Message,
    Error,
    {
      message?: string;
      contentList?: any[];
      files?: any[];
      threadId?: string;
    }
  >({
    mutationFn: ({ message, contentList, files, threadId }) => {
      return new Promise(async (resolve, reject) => {
        const finalThreadId = threadId ?? activeThread?.id;

        if (!finalThreadId) {
          reject(new Error('Thread ID is required to post message'));
          return;
        }

        const optimisticMessage = new Message({
          id: `temp-${Date.now()}`,
          content: message || '',
          createdAt: new Date(),
          createdBy: 'You',
          createdByUserId: 'you',
          messageThreadId: finalThreadId,
          optimistic: true,
        });

        queryClient.setQueryData(
          ['messages', finalThreadId],
          (oldMessages: Message[] = []) => [...oldMessages, optimisticMessage]
        );

        try {
          await queryClient.cancelQueries({
            queryKey: ['messages', finalThreadId],
          });

          const response = await addMessage(finalThreadId, message || '');

          queryClient.setQueryData(
            ['messages', finalThreadId],
            (oldMessages: Message[] = []) =>
              oldMessages.filter((msg) => !msg.optimistic).concat([response])
          );

          resolve(response);
        } catch (error) {
          queryClient.setQueryData(
            ['messages', finalThreadId],
            (oldMessages: Message[] = []) =>
              oldMessages.filter((msg) => !msg.optimistic)
          );
          reject(error);
        }
      });
    },
    onError: async () => {
      toast.error('There was an error posting your message');
      await refetch();
    },
    retry: false,
  });

  const addInputToMessageMutation = useMutation<
    Message,
    Error,
    {
      messageId: string;
      name: string;
      value: any;
      channels?: Record<string, number> | null;
    }
  >({
    mutationFn: ({ messageId, name, value }) => {
      return new Promise(async (resolve, reject) => {
        const finalThreadId = activeThread?.id;

        if (!finalThreadId) {
          reject(new Error('Thread ID is required to update message'));
          return;
        }

        queryClient.cancelQueries({ queryKey: ['messages', finalThreadId] });

        queryClient.setQueryData(
          ['messages', finalThreadId],
          (oldMessages: Message[] = []) =>
            oldMessages.map((msg) =>
              msg.id === messageId
                ? new Message({
                    ...msg,
                    [name]: value,
                  })
                : msg
            )
        );

        try {
          await new Promise((res) => setTimeout(res, 300));

          const updatedMessage = queryClient
            .getQueryData<Message[]>(['messages', finalThreadId])
            ?.find((m) => m.id === messageId);

          if (!updatedMessage) throw new Error('Message not found');
          resolve(updatedMessage);
        } catch (error) {
          queryClient.invalidateQueries({
            queryKey: ['messages', finalThreadId],
          });
          reject(error);
        }
      });
    },
    onError: (error) => {
      console.error('Error updating message:', error);
      toast.error('Failed to update message. Please try again.');
    },
    retry: false,
  });

  const addBotResponseMutation = useMutation<
    Message,
    Error,
    {
      threadId: string;
      threadTitle: string;
    }
  >({
    mutationFn: async ({ threadId, threadTitle }) => {
      // Simulate bot response
      await new Promise((res) => setTimeout(res, 1000));
      return new Message({
        id: `bot-${Date.now()}`,
        content: `Auto reply to "${threadTitle}"`,
        createdAt: new Date(),
        createdBy: 'SmartBot',
        createdByUserId: 'bot',
        messageThreadId: threadId,
      });
    },
  });

  const sendMessage = (content: string) => {
    if (!activeThread || !content.trim()) return;

    postMessageMutation.mutate(
      {
        threadId: activeThread.id,
        message: content,
      },
      {
        onSuccess: () => {
          addBotResponseMutation.mutate({
            threadId: activeThread.id,
            threadTitle: activeThread.name,
          });
        },
      }
    );
  };

  return {
    messages,
    isLoading: isLoading || isFetching,
    sendMessage,
    postMessageMutation,
    addInputToMessageMutation,
    isSendingMessage: postMessageMutation.isPending,
    isBotResponding: addBotResponseMutation.isPending,
    queryMessages: { data: messages, isLoading, error, refetch },
  };
}
