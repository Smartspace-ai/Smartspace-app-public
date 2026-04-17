import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useUserDisplayName, useUserId } from '@/platform/auth/session';

import { FileInfo } from '@/domains/files';
import { threadsKeys } from '@/domains/threads/queryKeys';

import { MessageValueType } from './enums';
import { Message, MessageContentItem } from './model';
import { messagesKeys } from './queryKeys';
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
  const userId = useUserId();
  const userName = useUserDisplayName();

  return useMutation<void, Error, SendArgs>({
    mutationFn: async ({
      workspaceId,
      threadId,
      contentList,
      files,
      variables,
    }) => {
      if (!threadId) throw new Error('Thread ID is required');
      if (!workspaceId) throw new Error('Workspace ID is required');

      // Optimistic message
      const optimistic: Message = {
        id: `temp-${Date.now()}`,
        values: [
          {
            id: `temp-${Date.now()}-prompt`,
            type: MessageValueType.INPUT,
            name: 'prompt',
            value: contentList,
            channels: {},
            createdAt: new Date(),
            createdBy: userName || 'You',
            createdByUserId: userId ?? undefined,
          },
          ...(files?.length
            ? [
                {
                  id: `temp-${Date.now()}-files`,
                  type: MessageValueType.INPUT,
                  name: 'files',
                  value: files,
                  channels: {},
                  createdAt: new Date(),
                  createdBy: userName || 'You',
                  createdByUserId: userId ?? undefined,
                },
              ]
            : []),
          ...(variables && Object.keys(variables).length
            ? [
                {
                  id: `temp-${Date.now()}-vars`,
                  type: MessageValueType.INPUT,
                  name: 'variables',
                  value: variables,
                  channels: {},
                  createdAt: new Date(),
                  createdBy: userName || 'You',
                  createdByUserId: userId ?? undefined,
                },
              ]
            : []),
        ],
        createdAt: new Date(),
        createdBy: userName || 'You',
        createdByUserId: userId ?? undefined,
        optimistic: true,
      };

      // add optimistic into cache
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) => [
        ...old,
        optimistic,
      ]);

      // Optimistically mark thread as running so the loading indicator shows immediately
      qc.setQueryData(
        threadsKeys.detail(workspaceId, threadId),
        (old: unknown) =>
          old && typeof old === 'object' ? { ...old, isFlowRunning: true } : old
      );

      // cancel in-flight refetches for this list so they don't race the optimistic insert
      await qc.cancelQueries({ queryKey: messagesKeys.list(threadId) });

      try {
        await postMessage({
          workSpaceId: workspaceId,
          threadId,
          contentList,
          files,
          variables,
        });
      } catch (err) {
        // rollback: remove optimistics and clear optimistic isFlowRunning
        qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) =>
          old.filter((x) => !x.optimistic)
        );
        qc.setQueryData(
          threadsKeys.detail(workspaceId, threadId),
          (old: unknown) =>
            old && typeof old === 'object'
              ? { ...old, isFlowRunning: false }
              : old
        );
        toast.error('There was an error posting your message');
        throw err;
      }

      // Reconcile thread list ordering / last-message preview and thread detail
      // (isFlowRunning). The messages list itself is driven by SignalR
      // ReceiveThreadUpdate -> mergeFetchedWithOptimistics, so don't invalidate it here.
      qc.invalidateQueries({
        predicate: (query) => {
          const k = query.queryKey as unknown[];
          return (
            k[0] === 'threads' &&
            k[1] === 'list' &&
            (k[2] as { workspaceId?: string })?.workspaceId === workspaceId
          );
        },
      });
      qc.invalidateQueries({
        queryKey: threadsKeys.detail(workspaceId, threadId),
      });
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
  const userId = useUserId();
  const userName = useUserDisplayName();

  const addInputToMessageMutation = useMutation<Message, Error, AddInputArgs>({
    mutationFn: async ({ threadId, messageId, name, value, channels }) => {
      if (!threadId) throw new Error('Thread ID is required');

      // optimistic local patch
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) =>
        old.map((m) =>
          m.id === messageId
            ? {
                ...m,
                values: [
                  ...(m.values ?? []),
                  {
                    id: `temp-${Date.now()}-add`,
                    type: MessageValueType.INPUT,
                    name,
                    value,
                    channels: channels ?? {},
                    createdAt: new Date(),
                    createdBy: userName || 'You',
                    createdByUserId: userId ?? undefined,
                  },
                ],
              }
            : m
        )
      );

      await qc.cancelQueries({ queryKey: messagesKeys.list(threadId) });

      const result = await addInputToMessage({
        messageId,
        name,
        value,
        channels,
      });
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
