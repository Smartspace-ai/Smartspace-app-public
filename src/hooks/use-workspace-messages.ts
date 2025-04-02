'use client';

import {
  addBotResponse,
  addInputToMessage,
  fetchMessages,
  postMessage,
} from '@/apis/messages';
import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import {
  Message,
  MessageCreateContent,
  MessageFile,
  MessageValueType,
} from '@/models/message';
import { MessageThread } from '@/models/message-threads';
import { Workspace } from '@/models/workspace';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

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
      contentList?: MessageCreateContent[];
      files?: MessageFile[];
      threadId?: string;
    }
  >({
    mutationFn: async ({ message, contentList, files, threadId }) => {
      const finalThreadId = threadId ?? activeThread?.id;
      const finalWorkspaceId = activeWorkspace?.id || '0';

      if (!finalThreadId)
        throw new Error('Thread ID is required to post message');

      const optimisticMessage = new Message({
        id: `temp-${Date.now()}`,
        values: [
          ...(contentList?.length
            ? [
                {
                  type: MessageValueType.INPUT,
                  name: 'prompt',
                  value: contentList,
                  channels: {},
                  createdAt: '',
                  createdBy: 'You',
                },
              ]
            : []),
          ...(files?.length
            ? [
                {
                  type: MessageValueType.INPUT,
                  name: 'files',
                  value: files,
                  channels: {},
                  createdAt: '',
                  createdBy: 'You',
                },
              ]
            : []),
        ],
        createdAt: new Date(),
        createdBy: 'You',
        optimistic: true,
      });

      queryClient.setQueryData<Message[]>(
        ['messages', finalThreadId],
        (old = []) => [...old, optimisticMessage]
      );

      await queryClient.cancelQueries({
        queryKey: ['messages', finalThreadId],
      });

      const response = await postMessage({
        workSpaceId: finalWorkspaceId,
        threadId: finalThreadId,
        contentList,
        files,
      });

      queryClient.setQueryData<Message[]>(
        ['messages', finalThreadId],
        (old = []) => old.filter((m) => !m.optimistic).concat(response)
      );

      return response;
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
    mutationFn: async ({ messageId, name, value, channels }) => {
      const finalThreadId = activeThread?.id;
      if (!finalThreadId) throw new Error('Thread ID is required');

      await queryClient.cancelQueries({
        queryKey: ['messages', finalThreadId],
      });

      queryClient.setQueryData<Message[]>(
        ['messages', finalThreadId],
        (old = []) =>
          old.map((msg) =>
            msg.id === messageId
              ? new Message({
                  ...msg,
                  values: [
                    ...(msg.values || []),
                    {
                      type: MessageValueType.INPUT,
                      name,
                      value,
                      channels: channels ?? {},
                      createdAt: '',
                      createdBy: 'You',
                    },
                  ],
                })
              : msg
          )
      );

      const response = await addInputToMessage({
        messageId,
        name,
        value,
        channels,
      });

      queryClient.setQueryData<Message[]>(
        ['messages', finalThreadId],
        (old = []) =>
          old.map((msg) => (msg.id === response.id ? response : msg))
      );

      return response;
    },
    onError: (error) => {
      console.error('Error updating message:', error);
      toast.error('Failed to update message. Please try again.');
      if (activeThread?.id) {
        queryClient.setQueryData<Message[]>(
          ['messages', activeThread.id],
          (old = []) => old.filter((msg) => !msg.optimistic)
        );
      }
    },
    retry: false,
  });

  const [isBotResponding, setIsBotResponding] = useState(false);

  const addBotResponseMutation = useMutation<
    Message,
    Error,
    {
      threadId: string;
      threadTitle: string;
    }
  >({
    mutationFn: async ({ threadId, threadTitle }) => {
      setIsBotResponding(true);
      return await addBotResponse(threadId, threadTitle);
    },
    onSuccess: (response) => {
      queryClient.setQueryData<Message[]>(
        ['messages', response.messageThreadId],
        (old = []) => [...old, response]
      );
      setIsBotResponding(false);
    },
    onError: () => {
      setIsBotResponding(false);
    },
  });

  const sendMessage = (
    message?: string,
    contentList?: MessageCreateContent[],
    files?: MessageFile[]
  ) => {
    if (!activeThread) return;

    setIsBotResponding(true);
    postMessageMutation.mutate(
      {
        threadId: activeThread.id,
        message,
        contentList,
        files,
      },
      {
        onSuccess: () => {
          if (activeThread.name) {
            addBotResponseMutation.mutate({
              threadId: activeThread.id,
              threadTitle: activeThread.name,
            });
          }
        },
        onError: () => {
          setIsBotResponding(false);
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
    isBotResponding,
    queryMessages: { data: messages, isLoading, error, refetch },
  };
}
