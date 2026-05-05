import { SignalR } from '@smartspace/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { ssInfo, ssWarn } from '@/platform/log';

import {
  applyThreadToCache,
  mapSignalRThreadSummaryToModel,
  applyDeltaToMessage,
  Message,
  MessageValueType,
  messagesKeys,
} from '@smartspace/chat-ui';

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

    // Collapse a message's `values` so each (name, type) pair appears at
    // most once, retaining the LAST occurrence. The server's terminal
    // message frame can carry every streaming chunk as its own response
    // OUTPUT value side-by-side; without this collapse `MessageItem`
    // renders one bubble per value, producing the cumulative-text-ladder
    // we see at the end of a flow run.
    const dedupValuesInMessage = (m: Message): Message => {
      const values = m.values ?? [];
      if (values.length <= 1) return m;
      const slot = new Map<string, number>();
      const out: typeof values = [];
      for (const v of values) {
        const key = `${v.name}|${v.type}`;
        const i = slot.get(key);
        if (i !== undefined) {
          out[i] = v;
        } else {
          slot.set(key, out.length);
          out.push(v);
        }
      }
      return out.length === values.length ? m : { ...m, values: out };
    };

    // True when the message has at least one OUTPUT value and no INPUT
    // values — i.e. it's an assistant response, not a user prompt. The
    // server emits each streaming chunk of an assistant response as a
    // full-message frame under a fresh id; we collapse those onto the
    // previous in-progress assistant message rather than letting each
    // chunk render as its own bubble.
    const isAssistantResponse = (m: Message) => {
      const values = m.values ?? [];
      if (!values.length) return false;
      let hasOutput = false;
      for (const v of values) {
        if (v.type === MessageValueType.INPUT) return false;
        if (v.type === MessageValueType.OUTPUT) hasOutput = true;
      }
      return hasOutput;
    };

    // Walk a sorted-by-createdAt list and merge runs of consecutive
    // assistant responses whose timestamps are within 5s of each other into
    // the latest entry of that run. The server's terminal snapshot can
    // include every intermediate streaming frame as its own message; this
    // collapses them so the UI shows one bubble per logical assistant turn.
    const collapseAssistantRuns = (msgs: Message[]): Message[] => {
      const out: Message[] = [];
      for (const m of msgs) {
        const prev = out[out.length - 1];
        if (
          prev &&
          isAssistantResponse(prev) &&
          isAssistantResponse(m) &&
          Math.abs(m.createdAt.getTime() - prev.createdAt.getTime()) < 5_000
        ) {
          out[out.length - 1] = m;
          continue;
        }
        out.push(m);
      }
      return out;
    };

    // The SSE is authoritative once it's open. Snapshot fully replaces; we
    // do not preserve client-only optimistics here because the SSE only
    // opens after `useSendMessage` has POSTed and written `[realMessage]`
    // to the cache, so by definition no optimistic temp-ids are still live.
    // The collapse step merges intermediate streaming frames the server may
    // include in the snapshot.
    const onSnapshot = (messages: Message[]) => {
      const sorted = collapseAssistantRuns(
        [...messages].map(dedupValuesInMessage).sort(byCreatedAt)
      );
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), sorted);
    };

    const onUpsert = (messageId: string, rawMessage: Message) => {
      const message = dedupValuesInMessage(rawMessage);
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) => {
        const idx = old.findIndex((m) => m.id === messageId);
        if (idx !== -1) {
          const copy = old.slice();
          copy[idx] = message;
          return copy;
        }
        // New id — but if this is an assistant response and the last cache
        // entry is also an assistant response with a near-identical
        // timestamp, treat the incoming as a cumulative-state update for
        // that same logical message and replace it in place.
        if (isAssistantResponse(message) && old.length > 0) {
          const last = old[old.length - 1];
          if (isAssistantResponse(last)) {
            const dt = Math.abs(
              message.createdAt.getTime() - last.createdAt.getTime()
            );
            if (dt < 5_000) {
              const copy = old.slice();
              copy[copy.length - 1] = message;
              return copy;
            }
          }
        }
        return [...old, message].sort(byCreatedAt);
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
