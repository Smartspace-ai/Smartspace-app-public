import type { QueryClient } from '@tanstack/react-query';

import type { MessageThread, ThreadsResponse } from './model';
import { threadsKeys } from './queryKeys';

type ThreadsListCache =
  | ThreadsResponse
  | { pages: ThreadsResponse[]; pageParams: unknown[] };

/**
 * Write a freshly-observed thread (from SignalR or an SSE thread frame)
 * directly into the relevant query caches so subscribers paint without a
 * refetch roundtrip.
 *
 * - Merges into `threadsKeys.detail(workspaceId, thread.id)`.
 * - Splices into every threads-list cache for the workspace, handling both
 *   finite `ThreadsResponse` and infinite `{ pages, pageParams }` shapes.
 *
 * Returns `true` when the thread was found in at least one list cache.
 * Callers that need to surface brand-new threads (e.g. another user just
 * created one) can fall back to invalidating the list queries when this
 * returns `false`.
 */
/**
 * True when a stale summary should be ignored. The guard is intentionally
 * narrow: we only reject writes that would resurrect a settled `running:
 * false` back to `true`. That's the only direction the original race can
 * cause harm in — a stale SignalR `receiveThreadUpdate` arriving after the
 * SSE terminal frame already wrote `false`.
 *
 * Naively rejecting every older-timestamp write breaks the SSE terminal
 * frame itself: `summaryEmittedAt` is derived from the server's
 * `lastUpdatedAt` (DB row timestamp), but mid-flow SignalR broadcasts can
 * carry fresher timestamps than the terminal frame, so a strict
 * "incoming.ts < existing.ts" rule rejects the very write that should
 * clear the running indicator. We sidestep that by only flagging writes
 * that change the running flag in the dangerous direction.
 *
 * Equal-or-undefined timestamps always fall through so the function stays
 * a no-op for callers that don't set the field.
 */
function isStaleSummary(
  incoming: Pick<MessageThread, 'summaryEmittedAt' | 'isFlowRunning'>,
  existing:
    | Pick<MessageThread, 'summaryEmittedAt' | 'isFlowRunning'>
    | undefined
): boolean {
  if (!existing) return false;
  if (typeof existing.summaryEmittedAt !== 'number') return false;
  if (typeof incoming.summaryEmittedAt !== 'number') return false;
  if (incoming.summaryEmittedAt >= existing.summaryEmittedAt) return false;
  // Only block stale writes that would flip a settled "not running" back
  // to "running". Same-direction or `running → not running` writes go
  // through even when the timestamp is older.
  return existing.isFlowRunning === false && incoming.isFlowRunning === true;
}

export function applyThreadToCache(
  qc: QueryClient,
  thread: MessageThread
): boolean {
  // Reject stale summaries (e.g. SignalR's lagged DB write landing after a
  // fresher SSE thread frame). The detail-cache check is authoritative
  // because every server-emitted summary writes there first.
  const existingDetail = qc.getQueryData<MessageThread>(
    threadsKeys.detail(thread.workSpaceId, thread.id)
  );
  if (isStaleSummary(thread, existingDetail)) {
    return false;
  }

  qc.setQueryData<MessageThread>(
    threadsKeys.detail(thread.workSpaceId, thread.id),
    (old) => ({ ...(old ?? thread), ...thread })
  );

  let foundInList = false;
  qc.setQueriesData<ThreadsListCache>(
    {
      predicate: (query) => {
        const k = query.queryKey as unknown[];
        return (
          k[0] === 'threads' &&
          k[1] === 'list' &&
          (k[2] as { workspaceId?: string } | undefined)?.workspaceId ===
            thread.workSpaceId
        );
      },
    },
    (old) => {
      if (!old) return old;
      if ('pages' in old && Array.isArray(old.pages)) {
        let changed = false;
        const pages = old.pages.map((page) => {
          if (!page?.data) return page;
          const idx = page.data.findIndex((t) => t.id === thread.id);
          if (idx === -1) return page;
          if (isStaleSummary(thread, page.data[idx])) return page;
          changed = true;
          foundInList = true;
          const nextData = page.data.slice();
          nextData[idx] = { ...nextData[idx], ...thread };
          return { ...page, data: nextData };
        });
        return changed ? { ...old, pages } : old;
      }
      const list = old as ThreadsResponse;
      if (!list.data) return old;
      const idx = list.data.findIndex((t) => t.id === thread.id);
      if (idx === -1) return old;
      if (isStaleSummary(thread, list.data[idx])) return old;
      foundInList = true;
      const nextData = list.data.slice();
      nextData[idx] = { ...nextData[idx], ...thread };
      return { ...list, data: nextData };
    }
  );

  return foundInList;
}

/**
 * Invalidate every threads-list cache for a workspace. Use as a fallback when
 * `applyThreadToCache` didn't find the thread in any list (i.e. brand-new
 * thread) so the sidebar refetches and picks it up.
 */
export function invalidateWorkspaceThreadLists(
  qc: QueryClient,
  workspaceId: string
): void {
  qc.invalidateQueries({
    predicate: (query) => {
      const k = query.queryKey as unknown[];
      return (
        k[0] === 'threads' &&
        k[1] === 'list' &&
        (k[2] as { workspaceId?: string } | undefined)?.workspaceId ===
          workspaceId
      );
    },
  });
}

/**
 * Client-only flag for "we just hit send for this thread, server hasn't
 * confirmed yet". Stored in its own cache cell (not on `MessageThread`)
 * so the SSE gate — which reads server-confirmed `isFlowRunning` from the
 * detail cache — stays unaffected. The unified UI selector
 * `useThreadIsRunning` ORs this with `thread.isFlowRunning` so the composer,
 * message list typing dots, and sidebar dot all light up at the same instant
 * on send and turn off together when the flow's terminal frame arrives.
 */
export function setThreadOptimisticRunning(
  qc: QueryClient,
  threadId: string,
  running: boolean
): void {
  qc.setQueryData<boolean>(threadsKeys.optimisticRunning(threadId), running);
}

/**
 * Optimistically flip a single thread's `isFlowRunning` flag in every list
 * cache for the workspace (finite + infinite shapes). Used by `useSendMessage`
 * so the sidebar dot lights up instantly without waiting for SignalR — the
 * detail cache is intentionally NOT touched here, since that value gates the
 * thread SSE and must stay server-confirmed.
 */
export function setThreadRunningInLists(
  qc: QueryClient,
  workspaceId: string,
  threadId: string,
  running: boolean
): void {
  qc.setQueriesData<ThreadsListCache>(
    {
      predicate: (query) => {
        const k = query.queryKey as unknown[];
        return (
          k[0] === 'threads' &&
          k[1] === 'list' &&
          (k[2] as { workspaceId?: string } | undefined)?.workspaceId ===
            workspaceId
        );
      },
    },
    (old) => {
      if (!old) return old;
      const patch = (t: MessageThread): MessageThread =>
        t.id === threadId ? { ...t, isFlowRunning: running } : t;
      if ('pages' in old && Array.isArray(old.pages)) {
        let changed = false;
        const pages = old.pages.map((page) => {
          if (!page?.data) return page;
          const idx = page.data.findIndex((t) => t.id === threadId);
          if (idx === -1) return page;
          changed = true;
          return { ...page, data: page.data.map(patch) };
        });
        return changed ? { ...old, pages } : old;
      }
      const list = old as ThreadsResponse;
      if (!list.data) return old;
      const idx = list.data.findIndex((t) => t.id === threadId);
      if (idx === -1) return old;
      return { ...list, data: list.data.map(patch) };
    }
  );
}
