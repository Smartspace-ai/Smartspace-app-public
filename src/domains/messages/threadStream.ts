import { SignalR } from '@smartspace/api-client';
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

const RECONNECT_BASE_DELAY_MS = 500;
const RECONNECT_MAX_DELAY_MS = 10_000;

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

    const onSnapshot = (messages: Message[]) => {
      const sorted = [...messages].sort(byCreatedAt);
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) => {
        const optimistics = old.filter((m) => m.optimistic);
        return [...sorted, ...optimistics];
      });
    };

    const onUpsert = (messageId: string, message: Message) => {
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

    const onDelta = (messageId: string, delta: MessageDelta) => {
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

    // Thread summary comes on the initial snapshot (late joiner catch-up) and
    // terminal frames (authoritative flow-complete). Treat these as the source
    // of truth for isFlowRunning — SignalR receiveThreadUpdate is a hint and
    // may silently drop if Azure SignalR flakes.
    const onThread = (summary: SignalR.MessageThreadSummary) => {
      applyThreadToCache(qc, mapSignalRThreadSummaryToModel(summary));
    };

    const backoffFor = (attempt: number) =>
      Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * 2 ** attempt);

    const run = async () => {
      let attempt = 0;
      while (!state.stopped && !controller.signal.aborted) {
        try {
          const result = await streamThreadMessages({
            threadId,
            signal: controller.signal,
            onSnapshot,
            onMessage: onUpsert,
            onDelta,
            onThread,
          });
          if (result.status === 'not-found') {
            ssInfo('sse', 'thread stream 404', { threadId });
            return;
          }
          // Server closed the connection cleanly. The terminal frame's
          // `onThread` (if any) has already flipped `isFlowRunning: false`
          // in the cache, which will trip the gate and trigger cleanup. Exit
          // immediately so we don't open a redundant connection while the
          // useEffect cleanup is still propagating.
          return;
        } catch (err) {
          if (controller.signal.aborted) return;
          ssWarn('sse', 'thread stream error — reconnecting', {
            threadId,
            attempt,
            error: err instanceof Error ? err.message : String(err),
          });
          const delay = backoffFor(attempt);
          await new Promise<void>((resolve) => {
            setTimeout(resolve, delay);
          });
          attempt += 1;
        }
      }
    };

    void run();

    return () => {
      state.stopped = true;
      controller.abort();
    };
  }, [threadId, enabled, qc]);
}
