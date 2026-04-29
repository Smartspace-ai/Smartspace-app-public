import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useUserDisplayName, useUserId } from '@/platform/auth/session';

import { FileInfo } from '@/domains/files';
import {
  type MessageThread,
  setThreadRunningInLists,
  threadsKeys,
} from '@/domains/threads';

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

      // eslint-disable-next-line no-console
      console.log('[Send:start]', {
        threadId,
        optimisticId: optimistic.id,
        existingIds: (
          qc.getQueryData<Message[]>(messagesKeys.list(threadId)) ?? []
        ).map((m) => m.id),
      });

      // add optimistic into cache
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) => [
        ...old,
        optimistic,
      ]);

      // Light up the sidebar's running indicator instantly. We patch the
      // thread-list caches only — NOT the detail cache, which gates the
      // thread SSE (that value must stay server-confirmed so we don't open
      // the SSE before the backend has actually started the flow). The
      // composer's spinner is already covered by `mutation.isPending`.
      setThreadRunningInLists(qc, workspaceId, threadId, true);

      // cancel in-flight refetches for this list so they don't race the optimistic insert
      await qc.cancelQueries({ queryKey: messagesKeys.list(threadId) });

      let realMessage: Message;
      try {
        realMessage = await postMessage({
          workSpaceId: workspaceId,
          threadId,
          contentList,
          files,
          variables,
        });
      } catch (err) {
        // rollback: remove optimistics, undo the running flag in lists
        qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) =>
          old.filter((x) => !x.optimistic)
        );
        setThreadRunningInLists(qc, workspaceId, threadId, false);
        toast.error('There was an error posting your message');
        throw err;
      }

      // eslint-disable-next-line no-console
      console.log('[Send:postReturned]', {
        threadId,
        optimisticId: optimistic.id,
        realMessageId: realMessage.id,
      });

      // Replace the optimistic temp-id entry with the server-authoritative
      // Message we just got back. If the thread SSE already added the same
      // id (from its snapshot frame), keep its copy — it's at least as fresh
      // as ours — and just drop the optimistic.
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) => {
        const withoutOptimistic = old.filter((m) => !m.optimistic);
        const alreadyPresent = withoutOptimistic.some(
          (m) => m.id === realMessage.id
        );
        return alreadyPresent
          ? withoutOptimistic
          : [...withoutOptimistic, realMessage];
      });

      // POST returned successfully — the server has accepted the message
      // and the flow is now running. Mirror that in the detail cache so:
      //   1. The composer doesn't briefly drop its "running" indicator
      //      between mutation resolution and the SignalR receiveThreadUpdate
      //      broadcast (which can lag by a few hundred ms).
      //   2. The thread SSE gate (which reads this value) opens immediately
      //      instead of waiting for SignalR to flip it.
      // SignalR / SSE thread frames will overwrite this with the authoritative
      // value as they arrive.
      qc.setQueryData<MessageThread>(
        threadsKeys.detail(workspaceId, threadId),
        (old) => (old ? { ...old, isFlowRunning: true } : old)
      );

      // Reconcile thread list ordering / last-message preview and thread detail
      // (isFlowRunning). Message content continues to arrive via the thread SSE.
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
