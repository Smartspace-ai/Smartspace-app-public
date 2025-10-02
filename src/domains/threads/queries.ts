
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { threadsKeys } from './queryKeys';
import { ThreadsResponse } from './schemas';
import { fetchThread, fetchThreads } from './service';
import { flowRunsKeys } from '../flowruns/queryKeys';
import { fetchFlowRunVariables } from '../flowruns/service';

export const useThread = ({workspaceId, threadId}: { workspaceId: string; threadId: string }) => {
  return useQuery({
    queryKey: threadsKeys.detail(workspaceId, threadId),
    queryFn: async () => {
        return await fetchThread(workspaceId, threadId);
    },
    refetchOnWindowFocus: false,
  });
}

export const useThreads = (workspaceId: string) => {
  return useQuery({
    queryKey: threadsKeys.list(workspaceId),
    queryFn: async () => {
        return await fetchThreads(workspaceId);
    },
    refetchOnWindowFocus: false,
  });
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



export function useThreadVariables({threadId}: { threadId: string }) {
  return useQuery({
    queryKey: flowRunsKeys.variables(threadId),
    enabled: !!threadId,
    queryFn: async () => {
        return await fetchFlowRunVariables(threadId);
     
    },
    refetchOnWindowFocus: false,
  });
}

