import type { QueryClient } from '@tanstack/react-query';
import {
  queryOptions,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { isDraftThreadId } from '@/shared/utils/threadId';

import type { MessageThread } from './model';
import { ThreadsResponse } from './model';
import { threadsKeys } from './queryKeys';
import { fetchThread, fetchThreads } from './service';

export const threadDetailOptions = ({
  workspaceId,
  threadId,
}: {
  workspaceId: string;
  threadId: string;
}) =>
  queryOptions({
    queryKey: threadsKeys.detail(workspaceId, threadId),
    queryFn: () => fetchThread(workspaceId, threadId),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

/**
 * Derive placeholder thread from list cache for instant detail display (e.g. drafts).
 * Searches all list caches for this workspace (infinite and non-infinite).
 */
export function getThreadPlaceholderFromListCache(
  queryClient: QueryClient,
  workspaceId: string,
  threadId: string
): MessageThread | undefined {
  const entries = queryClient.getQueriesData<
    ThreadsResponse | { pages: ThreadsResponse[] }
  >({
    queryKey: threadsKeys.lists(),
  });
  for (const [, data] of entries) {
    if (!data) continue;
    // Infinite query shape
    if (
      typeof data === 'object' &&
      'pages' in data &&
      Array.isArray(data.pages)
    ) {
      for (const page of data.pages) {
        const found = page?.data?.find?.((t) => t.id === threadId);
        if (found) return found;
      }
      continue;
    }
    // Non-infinite shape
    const list = data as ThreadsResponse;
    if (list?.data?.length) {
      const found = list.data.find((t) => t.id === threadId);
      if (found) return found;
    }
  }
  return undefined;
}

export const useThread = ({
  workspaceId,
  threadId,
  enabled = true,
}: {
  workspaceId: string;
  threadId: string;
  enabled?: boolean;
}) => {
  const queryClient = useQueryClient();
  const canFetch =
    enabled && !!workspaceId && !!threadId && !isDraftThreadId(threadId);
  const placeholderData = getThreadPlaceholderFromListCache(
    queryClient,
    workspaceId,
    threadId
  );
  return useQuery({
    ...threadDetailOptions({ workspaceId, threadId }),
    enabled: canFetch,
    placeholderData,
  });
};

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
