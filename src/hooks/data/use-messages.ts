import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addInputToMessage, getMessages, postMessage } from '../../apis/messages';
import { MessageCreateContent } from '../../models/message-create-content';
import { FileInfo } from '../../models/file';
import { MessageValueType } from '../../models/message';
import { Message } from '../../models/message';
import { MessageThread } from '../../models/message-thread';
import { Workspace } from '../../models/workspace';
import { toast } from 'sonner';

import { Subject } from 'rxjs';

export const useQueryMessages = (
  workspace: Workspace | null,
  messageThread: MessageThread | null,
) => {
  const queryClient = useQueryClient();

  const queryMessages = useQuery<Message[], Error>({
    queryKey: ['messages', messageThread?.id],
    queryFn: async () => {
      if (messageThread && messageThread.id !== 'new') {
        const response = await getMessages(messageThread.id);
        const messages = response.data.data as Message[];
        return messages.map((message) => new Message(message)).reverse();
      }
      return [];
    },
    retry: false,
    enabled: !!messageThread,
  });

  const postMessageMutation = useMutation<Subject<Message>, any, any>({
    // mutationKey: ['messages', messageThread?.id],
    mutationFn: async ({
      message,
      contentList,
      files,
      threadId,
    }: {
      message?: string;
      contentList?: MessageCreateContent[];
      files?: FileInfo[];
      threadId?: string;
    }) => {
      return new Promise(async (resolve, reject) => {
        try {
          await queryClient.cancelQueries({
            queryKey: ['messages', threadId ?? messageThread?.id],
          });

          const optimisticMessage = new Message({
            values: [
              {
                type: MessageValueType.INPUT,
                name: 'content',
                value: contentList || [{ text: message }],
                channels: {},
                createdAt: '',
                createdBy: 'You',
              },
              {
                type: MessageValueType.INPUT,
                name: 'files',
                value: files,
                channels: {},
                createdAt: '',
                createdBy: 'You',
              },
            ],
            createdAt: '',
            createdBy: 'You',
            hasComments: false,
            optimistic: true,
            comments: [],
          });

          queryClient.setQueryData(
            ['messages', threadId ?? messageThread?.id],
            (oldMessages: Message[] | undefined) => {
              if (!oldMessages) return [optimisticMessage];

              return oldMessages.concat([optimisticMessage]);
            },
          );

          const response = await postMessage({
            message,
            contentList,
            files,
            workspace,
            thread: messageThread,
            threadId: threadId ?? messageThread?.id,
          });

          // Subscribe to the response and update the query data
          const subscription = response.subscribe({
            next: (m: Message) => {
              const threads = queryClient.getQueryData<MessageThread[]>([
                'threads',
                workspace,
              ]);
              if (threads) {
                const id = threadId ?? messageThread?.id;
                const thread = threads.find((thread) => thread.id === id);
                if (!thread) {
                  console.log('thread not found');
                  queryClient.invalidateQueries({
                    queryKey: ['threads', workspace],
                  });
                }
              }

              queryClient.setQueryData(
                ['messages', threadId ?? messageThread?.id],
                (oldMessages: Message[] | undefined) => {
                  if (!oldMessages) return [m];

                  const messages = oldMessages.filter(
                    (oldMessage) => !oldMessage.optimistic,
                  );

                  if (messages.find((old_message) => old_message.id === m.id)) {
                    return messages.map((msg) => (msg.id === m.id ? m : msg));
                  } else {
                    return messages.concat([m]);
                  }
                },
              );
            },
            error: (error: any) => {
              // Reject the Promise to trigger onError
              reject(error);
              subscription.unsubscribe();
              resolve(response);
            },
            complete: () => {
              resolve(response);
            },
          });
        } catch (error) {
          // Reject the Promise to trigger onError
          reject(error);
        }
      });
    },
    onError: async (error) => {
      console.error(error);

      toast.error('There was an error posting your message');

      await queryMessages.refetch();
    },
    retry: false,
  });

  const addInputToMessageMutation = useMutation<Subject<Message>, any, any>({
    mutationFn: ({
      messageId,
      name,
      value,
      channels,
    }: {
      messageId: string;
      name: string;
      value: any;
      channels: Record<string, number> | null;
    }) => {
      return new Promise(async (resolve, reject) => {
        try {
          queryClient.cancelQueries({
            queryKey: ['messages', messageThread?.id],
          });

          queryClient.setQueryData(
            ['messages', messageThread?.id],
            (oldMessages: Message[] | undefined) => {
              if (!oldMessages) return [];

              const messages = oldMessages.map((m) => {
                if (m.id === messageId) {
                  m.values = m.values?.concat([
                    {
                      type: MessageValueType.INPUT,
                      name: name,
                      value: value,
                      channels: channels ?? {},
                      createdAt: '',
                      createdBy: 'You',
                    },
                  ]);
                }
                return m;
              });

              return messages;
            },
          );

          const response = await addInputToMessage({
            messageId,
            name,
            value,
            channels,
          });

          // Subscribe to the response and update the query data
          const subscription = response.subscribe({
            next: (m: Message) => {
              queryClient.setQueryData(
                ['messages', messageThread?.id],
                (oldMessages: Message[] | undefined) => {
                  if (!oldMessages) return [m];

                  const messages = oldMessages.filter(
                    (oldMessage) => !oldMessage.optimistic,
                  );

                  if (messages.find((old_message) => old_message.id === m.id)) {
                    return messages.map((msg) => (msg.id === m.id ? m : msg));
                  } else {
                    return messages.concat([m]);
                  }
                },
              );
            },
            error: (error: any) => {
              // Reject the Promise to trigger onError
              reject(error);
              subscription.unsubscribe();
              resolve(response);
            },
            complete: () => {
              resolve(response);
            },
          });
        } catch (error) {
          // Reject the Promise to trigger onError
          reject(error);
        }
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error('There was an error posting your message');
      queryClient.setQueryData(
        ['messages', messageThread?.id],
        (oldMessages: Message[] | undefined) =>
          (oldMessages || []).filter((msg) => !msg.optimistic),
      );
    },
    retry: false,
  });

  return { queryMessages, postMessageMutation, addInputToMessageMutation };
};
