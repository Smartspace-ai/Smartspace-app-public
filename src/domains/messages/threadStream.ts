import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { ssInfo, ssWarn } from '@/platform/log';

import {
  applyThreadToCache,
  mapSignalRThreadSummaryToModel,
} from '@/domains/threads';

import { applyDeltaToMessage } from './mapper';
import { Message } from './model';
import { messagesKeys } from './queryKeys';
import { type MessageDelta, streamThreadMessages } from './service';

const RECONNECT_BACKOFF_MS = 500;

/**
 * Holds the thread-scoped SSE open while `enabled` is true (typically bound
 * to the thread's server-confirmed `isFlowRunning`). The first frame is an
 * authoritative snapshot; subsequent frames carry full-message frames or
 * cumulative deltas. On transient errors we reopen and let the next snapshot
 * resync state — no cursor/since handshake. All work is aborted when the
 * threadId changes, `enabled` flips false, or the hook unmounts.
 */
export function useThreadMessageStream(
  threadId: string | undefined,
  enabled: boolean
): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!threadId || !enabled) return;

    const controller = new AbortController();
    const state = { stopped: false };

    // Sort ascending by createdAt so the UI renders oldest → newest regardless
    // of the order the server emits.
    const byCreatedAt = (a: Message, b: Message) =>
      a.createdAt.getTime() - b.createdAt.getTime();

    const applySnapshot = (messages: Message[]) => {
      const sorted = [...messages].sort(byCreatedAt);
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) => {
        const optimistics = old.filter((m) => m.optimistic);
        return [...sorted, ...optimistics];
      });
    };

    const applyUpsert = (messageId: string, message: Message) => {
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) => {
        const stable = old.filter((m) => !m.optimistic);
        const optimistics = old.filter((m) => m.optimistic);
        const idx = stable.findIndex((m) => m.id === messageId);
        const nextStable =
          idx === -1
            ? [...stable, message].sort(byCreatedAt)
            : stable.map((m, i) => (i === idx ? message : m));
        return [...nextStable, ...optimistics];
      });
    };

    const applyDelta = (messageId: string, delta: MessageDelta) => {
      if (!delta.outputs.length && !delta.errors.length) return;
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) => {
        const idx = old.findIndex((m) => m.id === messageId);
        // No base message yet — ignore. The full `message` frame either
        // hasn't arrived or we missed it; the next reconnect snapshot will
        // bring authoritative state.
        if (idx === -1) return old;
        const copy = old.slice();
        copy[idx] = applyDeltaToMessage(old[idx], delta);
        return copy;
      });
    };

    const handleSnapshot = (messages: Message[]) => applySnapshot(messages);
    const handleUpsert = (messageId: string, message: Message) =>
      applyUpsert(messageId, message);
    const handleDelta = (messageId: string, delta: MessageDelta) =>
      applyDelta(messageId, delta);

    // Thread summary comes on the initial snapshot (late joiner catch-up) and
    // terminal frames (authoritative flow-complete). Treat these as the source
    // of truth for isFlowRunning — SignalR receiveThreadUpdate is a hint and
    // may silently drop if Azure SignalR flakes.
    const handleThread = (
      summary: Parameters<
        NonNullable<Parameters<typeof streamThreadMessages>[0]['onThread']>
      >[0]
    ) => {
      applyThreadToCache(qc, mapSignalRThreadSummaryToModel(summary));
    };

    const run = async () => {
      while (!state.stopped && !controller.signal.aborted) {
        try {
          const result = await streamThreadMessages({
            threadId,
            signal: controller.signal,
            onSnapshot: handleSnapshot,
            onMessage: handleUpsert,
            onDelta: handleDelta,
            onThread: handleThread,
          });
          if (result.status === 'not-found') {
            ssInfo('sse', 'thread stream 404', { threadId });
            return;
          }
          if (state.stopped || controller.signal.aborted) return;
        } catch (err) {
          if (controller.signal.aborted) return;
          ssWarn('sse', 'thread stream error — reconnecting', {
            threadId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
        await new Promise((r) => setTimeout(r, RECONNECT_BACKOFF_MS));
      }
    };

    void run();

    return () => {
      state.stopped = true;
      controller.abort();
    };
  }, [threadId, enabled, qc]);
}
