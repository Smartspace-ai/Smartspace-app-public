import { addInputToMessage, fetchMessages, postMessage } from '@/apis/messages';
import { useSmartSpace } from '@/contexts/smartspace-context';
import {
  Message,
  MessageCreateContent,
  MessageFile,
  MessageValueType,
} from '@/models/message';
import { Workspace } from '@/models/workspace';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { uploadFiles } from '../apis/message-threads';
import { UserContext } from './use-user-information';

export function useWorkspaceMessages(
  passedWorkspace?: Workspace | null,
  threadId?: string | null,
) {
  const context = useSmartSpace();
  
  const activeWorkspace = passedWorkspace ?? context?.activeWorkspace;

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { graphData, graphPhoto } = useContext(UserContext);

  const activeUser = {
    name: graphData?.displayName ?? 'User',
    email: graphData?.mail ?? '',
    profilePhoto: graphPhoto || '',
  };

  // Fetch messages for the current thread
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
      return result.reverse(); // Latest at the bottom
    },
    enabled: !!threadId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const [isBotResponding, setIsBotResponding] = useState(false);

  // Send a new message (text + optional files)
  const postMessageMutation = useMutation<
    Message,
    Error,
    {
      message?: string;
      contentList?: MessageCreateContent[];
      files?: MessageFile[];
    }
  >({
    mutationFn: async ({ message, contentList, files }) => {
      if (!threadId)
        throw new Error('Thread ID is required to post message');

      const finalWorkspaceId = activeWorkspace?.id || '0';

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
                  createdBy: activeUser.name,
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
                  createdBy: activeUser.name,
                },
              ]
            : []),
        ],
        createdAt: new Date(),
        createdBy: activeUser.name,
        optimistic: true,
      });

      // Add optimistic message to cache
      queryClient.setQueryData<Message[]>(
        ['messages', threadId],
        (old = []) => [...old, optimisticMessage]
      );

      await queryClient.cancelQueries({
        queryKey: ['messages', threadId],
      });

      const response = await postMessage({
        workSpaceId: finalWorkspaceId,
        threadId,
        contentList,
        files,
      });

      await queryClient.refetchQueries({
        queryKey: ['threads', finalWorkspaceId],
      });

      // Replace optimistic with real message
      queryClient.setQueryData<Message[]>(
        ['messages', threadId],
        (old = []) => {
          const withoutOptimistic = old.filter((m) => !m.optimistic);
          const exists = withoutOptimistic.some((m) => m.id === response.id);
          return exists ? withoutOptimistic : [...withoutOptimistic, response];
        }
      );

      return response;
    },
    onError: async (e) => {
      console.error('Error posting message:', e);
      toast.error('There was an error posting your message');
      await refetch();
    },
    retry: false,
  });

  // Add additional input (form data, files) to an existing message
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
      // Optimistic input patch
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

      await queryClient.cancelQueries({ queryKey: ['messages', threadId] });

      const result = await addInputToMessage({ messageId, name, value, channels });
      
      await queryClient.refetchQueries({
        queryKey: ['threads', passedWorkspace?.id],
      });

      return result;
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

  // Wrapper for form-driven input submission
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

          const anchor = document.getElementById('chat-bottom-anchor');
          if (anchor) {
            anchor.scrollIntoView({ behavior: 'smooth' });
          }
        },
      }
    );
  };

  // Upload files and return MessageFile[]
  const uploadFilesMutation = useMutation<MessageFile[], Error, File[]>({
    mutationFn: async (files: File[]) => {
      const result = await uploadFiles(files, activeWorkspace?.id ?? '');
      return result;
    },
  });

  // Public method to send a message
  const sendMessage = (
    message?: string,
    contentList?: MessageCreateContent[],
    files?: MessageFile[]
  ) => {
    if (!threadId) {
      threadId = crypto.randomUUID();
      if (!context.activeWorkspace) {
        console.error('No active workspace to create thread in');
        return;
      }

      navigate(
        `/workspace/${context.activeWorkspace?.id}/thread/${threadId}`,
      );
    }

    setIsBotResponding(true);

    postMessageMutation.mutate(
      { message, contentList, files },
      {
        onSuccess: () => {
          setIsBotResponding(false);
          if (!threadId && activeWorkspace?.id) {
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
    addInputToMessageMutation, // exposed raw mutation
    addValueToMessage, // wrapped helper with scroll
  };
}
