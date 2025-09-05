import {
  Message,
  MessageCreateContent,
  MessageFile,
  MessageSchema,
} from '@/domains/messages/schemas';
import { addInputToMessage, fetchMessages, postMessage } from '@/domains/messages/service';
import { MessageValueType } from '@/models/message';

import { uploadFiles } from '@/apis/files';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Subject } from 'rxjs';
import { toast } from 'sonner';
import { useActiveUser } from '../../hooks/use-active-user';
import { useWorkspaceThreads } from '../../hooks/use-workspace-threads';

export function useWorkspaceMessages(
  workspaceId?: string,
  threadId?: string | null,
) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const activeUser = useActiveUser();
  // Wait for the thread list to load before enabling thread-specific queries
  const { isLoading: threadsLoading, threads } = useWorkspaceThreads();

  // Fetch messages for the current thread
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Message[], Error>({
    queryKey: ['messages', threadId],
    queryFn: async () => {
      if (!threadId) return [];
      const result = await fetchMessages(threadId);
      return result.reverse(); // Latest at the bottom
    },
    enabled: !!threadId && !threadsLoading,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
  });

  const [isBotResponding, setIsBotResponding] = useState(false);

  // Send a new message (text + optional files + optional variables)
  const postMessageMutation = useMutation<
    Subject<Message>,
    Error,
    {
      contentList?: MessageCreateContent[];
      files?: MessageFile[];
      variables?: Record<string, unknown>;
    }
  >({
    mutationFn: async ({ contentList, files, variables }) => {
      if (!threadId)
        throw new Error('Thread ID is required to post message');

      if (!workspaceId)
        throw new Error('Workspace ID is required to post message');

      const optimisticMessage = MessageSchema.parse({
        id: `temp-${Date.now()}`,
        values: [
          {
            type: MessageValueType.INPUT,
            name: 'prompt',
            value: contentList,
            channels: {},
            createdAt: new Date(),
            createdBy: activeUser.name,
          },
          ...(files != null
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
          ...(variables && Object.keys(variables).length > 0
            ? [
                {
                  type: MessageValueType.INPUT,
                  name: 'variables',
                  value: variables,
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
      
      return new Promise((resolve, reject) => {
        try {
          if (!threadId)
            throw new Error('Thread ID is required to post message');

          postMessage({
            workSpaceId: workspaceId,
            threadId,
            contentList,
            files,
            variables,
          })
            .then((response) => {
              // Subscribe to the response and update the query data
              const subscription = response.subscribe({
                next: (m: Message) => {
                  queryClient.setQueryData(
                    ['messages', threadId],
                    (oldMessages: Message[] | undefined) => {
                      if (!oldMessages) return [m];

                      const messages = oldMessages.filter(
                        (oldMessage) => !oldMessage.optimistic,
                      );

                      if (
                        messages.find((old_message) => old_message.id === m.id)
                      ) {
                        // Update the existing message
                        return messages.map((msg) =>
                          msg.id === m.id ? m : msg,
                        );
                      } else {
                        return messages.concat([m]);
                      }
                    },
                  );
                },
                error: (error: Error) => {
                  // Reject the Promise to trigger onError
                  reject(error);
                  subscription.unsubscribe();
                },
                complete: () => {
                  resolve(response);
                  
                  queryClient.refetchQueries({
                    queryKey: ['threads', workspaceId],
                  });
                },
              });
            })
            .catch((error) => {
              // Reject the Promise to trigger onError
              reject(error);
            });
        }
        catch (error) {
          // If there's an error, remove the optimistic message
          queryClient.setQueryData<Message[]>(
            ['messages', threadId],
            (old = []) => old.filter((m) => !m.optimistic),
          );
          reject(error);
        }
      });
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
      value: unknown;
      channels: Record<string, number> | null;
    }
  >({
    mutationFn: async ({ messageId, name, value, channels }) => {
      // Optimistic input patch
      queryClient.setQueryData<Message[]>(['messages', threadId], (old = []) =>
        old.map((m) => {
          if (m.id === messageId) {
            return MessageSchema.parse({
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
        queryKey: ['threads', workspaceId],
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
    value: unknown,
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
      if (!threadId) {
        throw new Error('Thread ID is required to upload files');
      }

      if (!workspaceId) {
        throw new Error('No active workspace to upload files to');
      }

      const result = await uploadFiles(files, {workspaceId, threadId});
      return result;
    },
  });

  // Public method to send a message
  const sendMessage = (
    contentList?: MessageCreateContent[],
    files?: MessageFile[],
    variables?: Record<string, unknown>
  ) => {
    if (!threadId) {
      // Ensure thread list is ready before deciding what to do
      if (threadsLoading) {
        toast.message('Loading threads. Please wait...');
        return;
      }
      if (threads && threads.length > 0 && workspaceId) {
        // Navigate to the first existing thread instead of a random id
        navigate({
          to: '/workspace/$workspaceId/thread/$threadId',
          params: { workspaceId, threadId: threads[0].id },
        });
        return;
      }
      // No threads available yet: ask user to create/select a thread
      toast.error('Please create or select a thread first.');
      return;
    }

    setIsBotResponding(true);

    postMessageMutation.mutate(
      { contentList, files, variables },
      {
        onSuccess: () => {
          setIsBotResponding(false);
          if (!threadId && workspaceId) {
            queryClient.invalidateQueries({
              queryKey: ['threads', workspaceId],
            });
          }
        },
        onError: (error) => {
          const data = (error as Error & { response?: { data?: unknown } })?.response?.data;
          const exception = typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch { return null; } })() : data;
          if (exception?.code === '409') {
            toast.error(exception.detail);
            queryClient.setQueryData<Message[]>(['messages', threadId], (old = []) =>
              old.filter((m) => !m.optimistic)
            );
          } else {
            toast.error('There was an error posting your message');
          }
          setIsBotResponding(false);
        },
      }
    );
  };

  return {
    messages,
    isLoading: isLoading,
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
