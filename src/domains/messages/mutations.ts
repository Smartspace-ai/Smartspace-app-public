import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Subject } from 'rxjs';
import { toast } from 'sonner';

import { FileInfo } from '@/domains/files/schemas';

import { MessageValueType } from './enums';
import { messagesKeys } from './queryKeys';
import { Message, MessageContentItem, MessageSchema } from './schemas';
import { addInputToMessage, postMessage } from './service';

type SendArgs = {
  workspaceId: string;
  threadId: string;
  contentList?: MessageContentItem[];
  files?: FileInfo[];
  variables?: Record<string, unknown>;
};

export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation<Subject<Message>, Error, SendArgs>({
    mutationFn: async ({ workspaceId, threadId, contentList, files, variables }) => {
      if (!threadId) throw new Error('Thread ID is required');
      if (!workspaceId) throw new Error('Workspace ID is required');

      // Optimistic message
      const optimistic: Message = MessageSchema.parse({
        id: `temp-${Date.now()}`,
        values: [
          {
            type: MessageValueType.INPUT,
            name: 'prompt',
            value: contentList,
            channels: {},
            createdAt: new Date(),
            createdBy: 'me',
          },
          ...(files?.length
            ? [{
                type: MessageValueType.INPUT,
                name: 'files',
                value: files,
                channels: {},
                createdAt: new Date(),
                createdBy: 'me',
              }]
            : []),
          ...(variables && Object.keys(variables).length
            ? [{
                type: MessageValueType.INPUT,
                name: 'variables',
                value: variables,
                channels: {},
                createdAt: new Date(),
                createdBy:'me',
              }]
            : []),
        ],
        createdAt: new Date(),
        createdBy:  'me',
        optimistic: true,
      });

      // add optimistic into cache
      qc.setQueryData<Message[]>(
        messagesKeys.list(threadId),
        (old = []) => [...old, optimistic]
      );

      // cancel in-flight refetches for this list
      await qc.cancelQueries({ queryKey: messagesKeys.list(threadId) });

      // start server call (streaming Subject)
      const subject = await postMessage({ workSpaceId: workspaceId, threadId, contentList, files, variables });

      // subscribe to server stream: replace optimistic with real items / updates
      const sub = subject.subscribe({
        next: (m: Message) => {
          qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) => {
            // drop optimistics
            const stable = old.filter((x) => !x.optimistic);
            // upsert by id
            const idx = stable.findIndex((x) => x.id === m.id);
            if (idx === -1) return [...stable, m];
            const copy = stable.slice();
            copy[idx] = m;
            return copy;
          });
        },
        error: (err: Error) => {
          // rollback: remove any optimistics
          qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) =>
            old.filter((x) => !x.optimistic)
          );
          toast.error('There was an error posting your message');
          sub.unsubscribe();
        },
        complete: () => {
          // Optionally invalidate related queries (e.g., thread list)
          // qc.invalidateQueries(threadsKeys.list(workspaceId));
          sub.unsubscribe();
        },
      });

      return subject;
    },
    retry: false,
  });
}

// Optional: keep addInputToMessage in a separate hook
type AddInputArgs = {
  workspaceId?: string; // only needed if you invalidate thread lists
  threadId: string;
  messageId: string;
  name: string;
  value: unknown;
  channels: Record<string, number> | null;
};

export function useAddInputToMessage() {
  const qc = useQueryClient();

  const addInputToMessageMutation = useMutation<Message, Error, AddInputArgs>({
    mutationFn: async ({ threadId, messageId, name, value, channels }) => {
      if (!threadId) throw new Error('Thread ID is required');

      // optimistic local patch
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) =>
        old.map((m) =>
          m.id === messageId
            ? MessageSchema.parse({
                ...m,
                values: [
                  ...(m.values ?? []),
                  {
                    type: MessageValueType.INPUT,
                    name,
                    value,
                    channels: channels ?? {},
                    createdAt: new Date(),
                    createdBy: 'me',
                  },
                ],
              })
            : m
        )
      );

      await qc.cancelQueries({ queryKey: messagesKeys.list(threadId) });

      const result = await addInputToMessage({ messageId, name, value, channels });
      return result; // already parsed in service.ts
    },
    onSuccess: (message, { threadId }) => {
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) => {
        const stable = old.filter((x) => !x.optimistic);
        const idx = stable.findIndex((x) => x.id === message.id);
        if (idx === -1) return [...stable, message];
        const copy = stable.slice();
        copy[idx] = message;
        return copy;
      });
    },
    onError: (_e, { threadId }) => {
      // rollback optimistic patch
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) =>
        old.filter((m) => !m.optimistic)
      );
      toast.error('There was an error posting your form input');
    },
    retry: false,
  });

  return {
    addInputToMessageMutation,
  };
}
