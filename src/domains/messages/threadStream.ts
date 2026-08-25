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
// How long a connection has to last, on top of having delivered something,
// before we treat it as healthy and reset the backoff. Set above the backoff
// ceiling so a connection has to outlive the wait that follows a drop to count
// as progress.
const MIN_HEALTHY_CONNECTION_MS = 15_000;

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

    // Whether the connection currently open has delivered a frame. Half of
    // the health test below; reset per attempt in the loop.
    let delivered = false;

    // The run state the most recent frame reported. Deliberately not latched:
    // this effect instance now spans reconnects, and a thread can start
    // another run within one, so a `true` that stuck would put us straight
    // back to the stranded-spinner behaviour this fix exists to remove.
    let runFinished = false;

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
    // do not preserve client-only optimistics here because the stream first
    // opens only after `useSendMessage` has POSTed and written `[realMessage]`
    // to the cache, so no optimistic temp-ids are still live. Note this now
    // also runs on every reopen mid-run, where the server's snapshot — which
    // overlays live Redis state onto the stored rows — is the authority we are
    // resyncing to. The collapse step merges intermediate streaming frames the
    // server may include in the snapshot.
    const onSnapshot = (messages: Message[]) => {
      delivered = true;
      const sorted = collapseAssistantRuns(
        [...messages].map(dedupValuesInMessage).sort(byCreatedAt)
      );
      qc.setQueryData<Message[]>(messagesKeys.list(threadId), (old = []) => {
        // A snapshot is authoritative for everything the server knows about,
        // but a reopen mid-run can land while a mutation is still holding an
        // optimistic entry the server has not seen yet — an input submitted
        // to a waiting flow, say. Those carry a `temp-` id and are removed by
        // their own mutation on settle, so carrying them across a replace is
        // what keeps a reopen from deleting the user's just-sent input.
        const pending = old.filter(
          (m) => m.id?.startsWith('temp-') && !sorted.some((x) => x.id === m.id)
        );
        return pending.length
          ? [...sorted, ...pending].sort(byCreatedAt)
          : sorted;
      });
    };

    const onUpsert = (messageId: string, rawMessage: Message) => {
      delivered = true;
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
      delivered = true;
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
      // `!` rather than `=== false`, so a summary missing the field reads
      // the same way here as it does at the gate that enables this hook.
      delivered = true;
      runFinished = !summary.isFlowRunning;
      applyThreadToCache(qc, mapSignalRThreadSummaryToModel(summary));
    };

    // Resolves early on abort, so a teardown doesn't leave this effect's
    // closures pinned alive for the length of a wait nobody is waiting for.
    const backoff = (attempt: number) =>
      new Promise<void>((resolve) => {
        if (controller.signal.aborted) {
          resolve();
          return;
        }
        const ceiling = Math.min(
          RECONNECT_MAX_DELAY_MS,
          RECONNECT_BASE_DELAY_MS * 2 ** attempt
        );
        // Jittered: every viewer of a thread reopens off the same server-side
        // event, and without this they would retry in lockstep.
        const timer = setTimeout(
          finish,
          ceiling / 2 + Math.random() * (ceiling / 2)
        );
        function finish() {
          clearTimeout(timer);
          controller.signal.removeEventListener('abort', finish);
          resolve();
        }
        controller.signal.addEventListener('abort', finish);
      });

    const run = async () => {
      let attempt = 0;

      while (!state.stopped && !controller.signal.aborted) {
        const openedAt = Date.now();
        // Tracked separately from the message: an Error with an empty message
        // would otherwise log a thrown failure as a clean close.
        let threw = false;
        let failure: string | undefined;
        delivered = false;

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
          if (result.status === 'forbidden') {
            // Reopening cannot recover access, and each attempt would spend
            // another token acquisition against the session-expiry breaker.
            ssWarn('sse', 'thread stream refused — not reopening', {
              threadId,
              httpStatus: result.httpStatus,
            });
            return;
          }
        } catch (err) {
          threw = true;
          failure = err instanceof Error ? err.message : String(err);
        }

        // An abort surfaces either way: as a throw, or as a clean close when
        // the parser cancels its reader and the pending read resolves
        // `{done: true}`. Check before treating this as a drop, or every
        // thread switch mid-run logs a false alarm and schedules a reopen the
        // cleanup has already made pointless.
        if (state.stopped || controller.signal.aborted) return;

        if (runFinished) {
          // Normal end of a run: `onThread` has already flipped
          // `isFlowRunning: false` in the cache, which trips the gate and
          // triggers cleanup. Exit immediately so we don't open a redundant
          // connection while the useEffect cleanup is still propagating.
          return;
        }

        // The stream ended without reporting the run finished. An ingress
        // idle-timeout, a replica recycle, and the server's own `yield break`
        // on a Redis error all end the response body exactly like a real
        // completion, so a clean close is indistinguishable from success
        // here — and returning stranded the viewer on a spinner only a page
        // refresh could clear. Reopen instead: the next snapshot frame carries
        // the authoritative thread summary, which either resumes the tail or
        // reports the run finished and tears this effect down.
        // Reset the backoff only for a connection that actually got somewhere:
        // it delivered a frame AND outlived the wait that follows a drop.
        // Judging on frames alone lets a server that emits its snapshot and
        // closes reset the clock and be reopened several times a second, and
        // judging on duration alone counts a token acquisition or a TCP
        // connect that hung before failing. Anything else lets `attempt`
        // climb, so a backend that is closing every connection is reopened at
        // the ceiling rather than hammered.
        const lastedMs = Date.now() - openedAt;
        if (delivered && lastedMs >= MIN_HEALTHY_CONNECTION_MS) {
          attempt = 0;
        }

        // A clean close is expected often enough not to be a warning: on a
        // long run behind a short ingress timeout it is once a minute, per
        // viewer. `lastedMs` and `delivered` are what separate that from a
        // backend closing every connection at once.
        if (threw) {
          ssWarn('sse', 'thread stream error — reconnecting', {
            threadId,
            attempt,
            lastedMs,
            delivered,
            error: failure,
          });
        } else {
          ssInfo(
            'sse',
            'thread stream closed with no terminal frame — reopening',
            { threadId, attempt, lastedMs, delivered }
          );
        }

        await backoff(attempt);
        attempt += 1;
      }
    };

    void run();

    return () => {
      state.stopped = true;
      controller.abort();
    };
  }, [threadId, enabled, qc]);
}
