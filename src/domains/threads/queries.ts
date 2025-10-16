import { queryOptions, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { ThreadsResponse } from './model';
import { threadsKeys } from './queryKeys';
import { fetchThread, fetchThreads } from './service';

export const threadDetailOptions = ({ workspaceId, threadId }: { workspaceId: string; threadId: string }) =>
  queryOptions({
    queryKey: threadsKeys.detail(workspaceId, threadId),
    queryFn: () => fetchThread(workspaceId, threadId),
    refetchOnWindowFocus: false,
  });

export const useThread = ({workspaceId, threadId}: { workspaceId: string; threadId: string }) => {
  return useQuery(threadDetailOptions({ workspaceId, threadId }));
}

export const threadsListOptions = (workspaceId: string) =>
  queryOptions({
    queryKey: threadsKeys.list(workspaceId),
    queryFn: () => fetchThreads(workspaceId),
    refetchOnWindowFocus: false,
  });

export const useThreads = (workspaceId: string) => {
  return useQuery(threadsListOptions(workspaceId));
}

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
    getNextPageParam: (lastPage: ThreadsResponse, allPages: ThreadsResponse[]) => {
      const totalLoaded = allPages.reduce((acc, page) => acc + page.data.length, 0);
      return totalLoaded < lastPage.total ? allPages.length : undefined;
    },
    enabled: enabled && !!workspaceId,
    refetchOnWindowFocus: false,
  });
}
 