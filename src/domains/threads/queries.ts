// App-side threads queries — sidebar list / paginated only. Chat-relevant
// queries (threadDetailOptions, useThread, useThreadIsRunning,
// getThreadPlaceholderFromListCache) live in @smartspace/chat-ui.
import {
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';

import { threadsKeys, type ThreadsResponse } from '@smartspace/chat-ui';

import { fetchThreads } from './service';

export const threadsListOptions = (
  workspaceId: string,
  opts?: { take?: number; skip?: number }
) =>
  queryOptions({
    queryKey: threadsKeys.list(workspaceId, opts),
    queryFn: () =>
      opts ? fetchThreads(workspaceId, opts) : fetchThreads(workspaceId),
    refetchOnWindowFocus: false,
  });

export const useThreads = (workspaceId: string) => {
  return useQuery(threadsListOptions(workspaceId));
};

export const useInfiniteThreads = (
  workspaceId: string,
  options?: {
    pageSize?: number;
    enabled?: boolean;
    /** Server-side name/id filter; the response `total` reflects it. */
    search?: string;
  }
) => {
  const { pageSize = 20, enabled = true } = options || {};
  const search = options?.search?.trim() || undefined;

  return useInfiniteQuery({
    // The unsearched key keeps its exact historical shape — cache writers
    // (draft threads, rename/pin mutations, realtime merges) patch by the
    // `lists()` prefix, and the placeholder lookup reads through it.
    queryKey: threadsKeys.list(
      workspaceId,
      search ? { take: pageSize, search } : { take: pageSize }
    ),
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      return await fetchThreads(workspaceId, {
        take: pageSize,
        skip: pageParam * pageSize,
        search,
      });
    },
    // Keep the previous list rendered while a new search resolves, instead of
    // flashing the skeleton on every keystroke's key change.
    placeholderData: keepPreviousData,
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: ThreadsResponse,
      allPages: ThreadsResponse[]
    ) => {
      const totalLoaded = allPages.reduce(
        (acc, page) => acc + page.data.length,
        0
      );
      return totalLoaded < lastPage.total ? allPages.length : undefined;
    },
    enabled: enabled && !!workspaceId,
    refetchOnWindowFocus: false,
  });
};
