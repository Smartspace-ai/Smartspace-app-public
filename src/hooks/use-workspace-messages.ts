import { fetchMessages, postMessage } from '@/apis/messages';
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
          const withoutOptimistic = (old || []).filter((m) => !m.optimistic);
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

  const [isBotResponding, setIsBotResponding] = useState(false);

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

          // Only invalidate threads if this was a new thread
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
    isSendingMessage: postMessageMutation.isPending,
    isBotResponding,
    queryMessages: { data: messages, isLoading, error, refetch },
  };
}
