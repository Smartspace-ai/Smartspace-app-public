import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useChatIdentity, useChatService } from '@/platform/chat';


import { FileInfo } from '@/domains/files';
import {
  type MessageThread,
  setThreadOptimisticRunning,
  setThreadRunningInLists,
  threadsKeys,
} from '@/domains/threads';

import { randomUUID } from '@/shared/utils/randomUUID';

import { MessageValueType } from './enums';
import { Message, MessageContentItem } from './model';
import { messagesKeys } from './queryKeys';

/**
 * Reconcile an optimistic placeholder with a server-confirmed message.
 *
 * Drops every entry flagged `optimistic: true` from `old`, then merges
 * `incoming` into the remaining list:
 *
 * - **No match by id** → append.
 * - **Match exists** → behaviour controlled by `onDuplicate`:
 *   - `keep-existing` (default): leave the existing entry untouched. Used by
 *     `useSendMessage` so a richer SSE-delivered version isn't overwritten
 *     by the sparse `POST /Messages/start` response.
 *   - `replace`: overwrite the existing entry with `incoming`. Used by
 *     `useAddInputToMessage`, where the mutation response carries the
 *     latest server state we want to commit.
 */
function reconcileWithMessage(
  old: Message[],
  incoming: Message,
  onDuplicate: 'keep-existing' | 'replace' = 'keep-existing'
): Message[] {
  const stable = old.filter((m) => !m.optimistic);
  const idx = stable.findIndex((m) => m.id === incoming.id);
  if (idx === -1) return [...stable, incoming];
  if (onDuplicate === 'keep-existing') return stable;
  const copy = stable.slice();
  copy[idx] = incoming;
  return copy;
}

type SendArgs = {
  workspaceId: string;
  threadId: string;
  contentList?: MessageContentItem[];
  files?: FileInfo[];
  variables?: Record<string, unknown>;
};

export function useSendMessage() {
  const qc = useQueryClient();
  const { userId, displayName: userName } = useChatIdentity();
  const service = useChatService();

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
        id: `temp-${randomUUID()}`,
        values: [
          {
            id: `temp-${randomUUID()}-prompt`,
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
                  id: `temp-${randomUUID()}-files`,
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
                  id: `temp-${randomUUID()}-vars`,
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

      // Light up every running indicator (composer spinner, message-list
      // typing dots, sidebar dot) on the same render. The optimistic flag
      // lives in its own cache cell, so the SSE gate — which reads server-
      // confirmed `isFlowRunning` from the detail cache — stays untouched
      // and we don't open the stream before the backend has actually
      // started the flow. The list-cache patch keeps cross-tab SignalR
      // semantics consistent for sidebars that aren't reading the unified
      // selector.
      setThreadOptimisticRunning(qc, threadId, true);
      setThreadRunningInLists(qc, workspaceId, threadId, true);

      // cancel in-flight refetches for this list so they don't race the optimistic insert
      await qc.cancelQueries({ queryKey: messagesKeys.list(threadId) });

      let realMessage: Message;
      try {
        realMessage = await service.sendMessage({
          workspaceId,
          threadId,
          contentList,
          files,
          variables,
        });
      } catch (err) {
        // rollback: remove optimistics, undo the running flags
        qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) =>
          old.filter((x) => !x.optimistic)
        );
        setThreadOptimisticRunning(qc, threadId, false);
        setThreadRunningInLists(qc, workspaceId, threadId, false);
        toast.error('There was an error posting your message');
        throw err;
      }

      // Reconcile the optimistic placeholder with the server's realMessage
      // in place. We previously replaced the cache with `[realMessage]` and
      // relied on the SSE snapshot to restore history, but with the (now
      // in use) `/Messages/start` endpoint the POST resolves in ~50ms
      // while the SSE snapshot can take a few hundred ms longer; the gap
      // was producing a visible "all old messages flicker" the moment the
      // user hit send. `reconcileWithMessage`'s default `keep-existing`
      // duplicate strategy ensures that if the SSE happened to deliver
      // realMessage first (carrying richer in-progress state) we don't
      // overwrite it with the sparse POST response.
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) =>
        reconcileWithMessage(old, realMessage)
      );

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

      // Detail cache now holds the server-confirmed truth — drop the
      // optimistic flag so the unified selector relies purely on
      // `isFlowRunning` from here. SSE/SignalR terminal frames will flip
      // it false to stop every indicator together.
      setThreadOptimisticRunning(qc, threadId, false);

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
  const { userId, displayName: userName } = useChatIdentity();
  const service = useChatService();

  const addInputToMessageMutation = useMutation<
    Message,
    Error,
    AddInputArgs,
    { previousMessages: Message[] }
  >({
    onMutate: async ({ threadId, messageId, name, value, channels }) => {
      // Cancel in-flight refetches so they don't overwrite the optimistic patch.
      await qc.cancelQueries({ queryKey: messagesKeys.list(threadId) });

      // Snapshot before mutating — used for rollback.
      const previousMessages =
        qc.getQueryData<Message[]>(messagesKeys.list(threadId)) ?? [];

      // Apply optimistic patch.
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) =>
        old.map((m) =>
          m.id === messageId
            ? {
                ...m,
                values: [
                  ...(m.values ?? []),
                  {
                    id: `temp-${randomUUID()}-add`,
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

      return { previousMessages };
    },
    mutationFn: async ({ threadId, messageId, name, value, channels }) => {
      if (!threadId) throw new Error('Thread ID is required');

      return await service.addInputToMessage({
        messageId,
        name,
        value,
        channels,
      });
    },
    onSuccess: (message, { threadId }) => {
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) =>
        reconcileWithMessage(old, message, 'replace')
      );
    },
    onError: (_e, { threadId }, context) => {
      // Restore the pre-mutation snapshot.
      if (context) {
        qc.setQueryData<Message[]>(
          messagesKeys.list(threadId),
          context.previousMessages
        );
      }
      toast.error('There was an error posting your form input');
    },
    retry: false,
  });

  return {
    addInputToMessageMutation,
  };
}
