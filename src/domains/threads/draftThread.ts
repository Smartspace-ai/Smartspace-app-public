import type { QueryClient } from '@tanstack/react-query';

import {
  createDraftThreadId,
  isDraftThreadId,
  markDraftThreadId,
  unmarkDraftThreadId,
} from '@/shared/utils/threadId';

import type { MessageThread, ThreadsResponse } from './model';
import { threadsKeys } from './queryKeys';

type ThreadsListMeta = { workspaceId?: string };
type ThreadsListKey = readonly unknown[];

function isThreadsListMeta(x: unknown): x is ThreadsListMeta {
  return !!x && typeof x === 'object' && 'workspaceId' in x;
}

function isThreadsResponse(x: unknown): x is ThreadsResponse {
  if (!x || typeof x !== 'object') return false;
  const obj = x as Record<string, unknown>;
  return Array.isArray(obj.data);
}

function isInfiniteThreadsResponse(
  x: unknown
): x is { pages: ThreadsResponse[]; pageParams?: unknown[] } {
  if (!x || typeof x !== 'object') return false;
  const obj = x as Record<string, unknown>;
  return Array.isArray(obj.pages);
}

function findExistingDraftThreadId(
  workspaceId: string,
  queryClient: QueryClient
): string | null {
  const listQueries = queryClient
    .getQueryCache()
    .findAll({ queryKey: threadsKeys.lists() });

  for (const q of listQueries) {
    const qk = q.queryKey as ThreadsListKey;
    const meta = qk?.[2];
    if (!isThreadsListMeta(meta)) continue;
    if (meta.workspaceId !== workspaceId) continue;

    const data = queryClient.getQueryData(qk);
    if (!data) continue;

    if (isInfiniteThreadsResponse(data)) {
      for (const page of data.pages) {
        const found = page?.data?.find?.((t: MessageThread) =>
          isDraftThreadId(t.id)
        );
        if (found) return found.id;
      }
      continue;
    }

    if (isThreadsResponse(data)) {
      const found = data.data.find((t) => isDraftThreadId(t.id));
      if (found) return found.id;
    }
  }
  return null;
}

function upsertDraftIntoListCache(
  workspaceId: string,
  draft: MessageThread,
  queryClient: QueryClient
) {
  const queries = queryClient
    .getQueryCache()
    .findAll({ queryKey: threadsKeys.lists() });

  for (const q of queries) {
    const qk = q.queryKey as ThreadsListKey;
    const meta = qk?.[2];
    if (!isThreadsListMeta(meta)) continue;
    if (meta.workspaceId !== workspaceId) continue;

    queryClient.setQueryData(qk, (old: unknown) => {
      if (!old) return old;

      if (isInfiniteThreadsResponse(old)) {
        const pages = old.pages.slice();
        if (!pages[0] || !Array.isArray(pages[0].data)) return old;

        const first = pages[0];
        const already = first.data.some(
          (t: MessageThread) => t.id === draft.id
        );
        if (already) return old;

        pages[0] = { ...first, data: [draft, ...first.data] };
        for (let i = 0; i < pages.length; i++) {
          const p = pages[i];
          if (!p || typeof p.total !== 'number') continue;
          pages[i] = { ...p, total: p.total + 1 };
        }
        return { ...old, pages };
      }

      if (isThreadsResponse(old)) {
        const env = old;
        const already = env.data.some((t) => t.id === draft.id);
        if (already) return old;
        return {
          ...env,
          data: [draft, ...env.data],
          total: typeof env.total === 'number' ? env.total + 1 : env.total,
        } satisfies ThreadsResponse;
      }

      return old;
    });
  }
}

/**
 * Ensures a draft thread exists for the given workspace. If one already exists
 * in the query cache, returns it. Otherwise creates a new one and primes the caches.
 */
export function ensureDraftThread(
  workspaceId: string,
  queryClient: QueryClient
): { draftId: string; isExisting: boolean } {
  const existingDraftId = findExistingDraftThreadId(workspaceId, queryClient);
  if (existingDraftId) {
    return { draftId: existingDraftId, isExisting: true };
  }

  const draftId = createDraftThreadId();
  markDraftThreadId(draftId);

  const now = new Date();
  const draftThread: MessageThread = {
    id: draftId,
    name: 'New Thread',
    createdAt: now,
    createdBy: 'me',
    createdByUserId: '',
    isFlowRunning: false,
    lastUpdatedAt: now,
    lastUpdatedByUserId: '',
    totalMessages: 0,
    pinned: false,
    workSpaceId: workspaceId,
  };

  queryClient.setQueryData(
    threadsKeys.detail(workspaceId, draftId),
    draftThread
  );
  upsertDraftIntoListCache(workspaceId, draftThread, queryClient);

  return { draftId, isExisting: false };
}

/**
 * Removes a draft thread from the query cache and unmarks it from session storage.
 * Used for rollback when navigation fails.
 */
export function removeDraftThread(
  workspaceId: string,
  draftId: string,
  queryClient: QueryClient
) {
  const queries = queryClient
    .getQueryCache()
    .findAll({ queryKey: threadsKeys.lists() });

  for (const q of queries) {
    const qk = q.queryKey as ThreadsListKey;
    const meta = qk?.[2];
    if (!isThreadsListMeta(meta)) continue;
    if (meta.workspaceId !== workspaceId) continue;

    queryClient.setQueryData(qk, (old: unknown) => {
      if (!old) return old;

      if (isInfiniteThreadsResponse(old)) {
        const hadAny = old.pages.some(
          (p) => Array.isArray(p?.data) && p.data.some((t) => t.id === draftId)
        );
        const pages = old.pages.map((p) => {
          if (!p || !Array.isArray(p.data)) return p;
          const next = p.data.filter((t) => t.id !== draftId);
          const total =
            hadAny && typeof p.total === 'number'
              ? Math.max(0, p.total - 1)
              : p.total;
          return next.length === p.data.length
            ? { ...p, total }
            : { ...p, data: next, total };
        });
        return { ...old, pages };
      }

      if (isThreadsResponse(old)) {
        const env = old;
        const next = env.data.filter((t) => t.id !== draftId);
        if (next.length === env.data.length) return old;
        return {
          ...env,
          data: next,
          total:
            typeof env.total === 'number'
              ? Math.max(0, env.total - 1)
              : env.total,
        } satisfies ThreadsResponse;
      }

      return old;
    });
  }

  unmarkDraftThreadId(draftId);
  queryClient.removeQueries({
    queryKey: threadsKeys.detail(workspaceId, draftId),
    exact: true,
  });
}
