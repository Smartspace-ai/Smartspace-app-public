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
export function applyThreadToCache(
  qc: QueryClient,
  thread: MessageThread
): boolean {
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
