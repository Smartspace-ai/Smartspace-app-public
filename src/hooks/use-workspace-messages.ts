import { addInputToMessage, fetchMessages, postMessage } from '@/apis/messages';
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
import { useContext, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { uploadFiles } from '../apis/message-threads';
import { UserContext } from './use-user-information';

export function useWorkspaceMessages(
  passedWorkspace?: Workspace | null,
  passedThread?: MessageThread | null
) {
  const context = useSmartSpaceChat();
  const activeThread = passedThread ?? context?.activeThread;
  const activeWorkspace = passedWorkspace ?? context?.activeWorkspace;

  const queryClient = useQueryClient();
  const { graphData, graphPhoto } = useContext(UserContext);
  const { threadId: urlThreadId } = useParams<{ threadId: string }>();

  const threadId = activeThread?.id || urlThreadId;

  const activeUser = {
    name: graphData?.displayName ?? 'User',
    email: graphData?.mail ?? '',
    profilePhoto: graphPhoto || '',
  };

  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<Message[], Error>({
    queryKey: ['messages', threadId],
    queryFn: async () => {
      if (!threadId) return [];
      const result = await fetchMessages(threadId);
      return result.reverse();
    },
    enabled: !!threadId,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const [isBotResponding, setIsBotResponding] = useState(false);

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
      const finalThreadId = threadId ?? urlThreadId;
      const finalWorkspaceId = activeWorkspace?.id || '0';
      const createdBy = activeUser.name;

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
                  createdAt: new Date(),
                  createdBy,
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
                  createdAt: new Date(),
                  createdBy,
                },
              ]
            : []),
        ],
        createdAt: new Date(),
        createdBy,
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
        (old = []) => {
          const withoutOptimistic = old.filter((m) => !m.optimistic);
          const exists = withoutOptimistic.some((m) => m.id === response.id);
          return exists ? withoutOptimistic : [...withoutOptimistic, response];
        }
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
      channels: Record<string, number> | null;
    }
  >({
    mutationFn: async ({ messageId, name, value, channels }) => {
      // Optimistic update
      queryClient.setQueryData<Message[]>(['messages', threadId], (old = []) =>
        old.map((m) => {
          if (m.id === messageId) {
            return new Message({
              ...m,
              values: [
                ...(m.values ?? []),
                {
                  type: MessageValueType.INPUT,
                  name,
                  value,
                  channels: channels ?? {},
                  createdAt: new Date(),
                  createdBy: activeUser.name,
                },
              ],
            });
          }
          return m;
        })
      );

      await queryClient.cancelQueries({
        queryKey: ['messages', threadId],
      });

      return await addInputToMessage({ messageId, name, value, channels });
    },

    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(
        ['messages', threadId],
        (old = []) => {
          const withoutOptimistic = old.filter((m) => !m.optimistic);
          const exists = withoutOptimistic.some((m) => m.id === message.id);

          return exists
            ? withoutOptimistic.map((m) => (m.id === message.id ? message : m))
            : [...withoutOptimistic, message];
        }
      );
    },

    onError: (error) => {
      console.error(error);
      toast.error('There was an error posting your form input');
      queryClient.setQueryData<Message[]>(['messages', threadId], (old = []) =>
        old.filter((m) => !m.optimistic)
      );
    },
    retry: false,
  });

  const addValueToMessage = (
    messageId: string,
    name: string,
    value: any,
    channels: Record<string, number>
  ) => {
    setIsBotResponding(true);

    addInputToMessageMutation.mutate(
      { messageId, name, value, channels },
      {
        onSettled: () => {
          setIsBotResponding(false);

          // Scroll to bottom on form submit
          const anchor = document.getElementById('chat-bottom-anchor');
          if (anchor) {
            anchor.scrollIntoView({ behavior: 'smooth' });
          }
        },
      }
    );
  };

  const uploadFilesMutation = useMutation<MessageFile[], Error, File[]>({
    mutationFn: async (files: File[]) => {
      const result = await uploadFiles(files, activeWorkspace?.id ?? '');
      return result;
    },
  });

  const sendMessage = (
    message?: string,
    contentList?: MessageCreateContent[],
    files?: MessageFile[]
  ) => {
    const currentThreadId = threadId;

    if (!currentThreadId) {
      toast.error('No thread ID found. Cannot send message.');
      return;
    }

    setIsBotResponding(true);

    postMessageMutation.mutate(
      {
        threadId: currentThreadId,
        message,
        contentList,
        files,
      },
      {
        onSuccess: () => {
          setIsBotResponding(false);

          if (!activeThread && activeWorkspace?.id) {
            queryClient.invalidateQueries({
              queryKey: ['threads', activeWorkspace.id],
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
    uploadFiles: uploadFilesMutation.mutateAsync,
    isUploadingFiles: uploadFilesMutation.isPending,
    isSendingMessage: postMessageMutation.isPending,
    isBotResponding,
    queryMessages: { data: messages, isLoading, error, refetch },
    addInputToMessageMutation, // raw mutation
    addValueToMessage, // wrapped helper
  };
}
