// App-side threads queries — sidebar list / paginated only. Chat-relevant
// queries (threadDetailOptions, useThread, useThreadIsRunning,
// getThreadPlaceholderFromListCache) live in @smartspace/chat-ui.
import {
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
  }
) => {
  const { pageSize = 20, enabled = true } = options || {};

  return useInfiniteQuery({
    queryKey: threadsKeys.list(workspaceId, { take: pageSize }),
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      return await fetchThreads(workspaceId, {
        take: pageSize,
        skip: pageParam * pageSize,
      });
    },
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
