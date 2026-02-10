// src/ui/threads/useThreadsList.vm.ts
import { useMemo } from 'react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import type { MessageThread } from '@/domains/threads';
import { THREAD_LIST_PAGE_SIZE, useInfiniteThreads } from '@/domains/threads';


import { usePendingThreads } from '@/ui/threads/PendingThreadsContext';

import { NEW_THREAD_ID } from '@/shared/utils/threadId';

type Options = {
  workspaceId: string;
  pageSize?: number;
};

function makeNewThreadRow(workspaceId: string): MessageThread {
  return {
    id: NEW_THREAD_ID,
    name: 'New Thread',
    createdAt: new Date(0),
    createdBy: '',
    createdByUserId: '',
    isFlowRunning: false,
    lastUpdatedAt: new Date(0),
    lastUpdatedByUserId: '',
    totalMessages: 0,
    favorited: false,
    workSpaceId: workspaceId,
  };
}

export function useThreadsListVm({
  workspaceId,
  pageSize = THREAD_LIST_PAGE_SIZE,
}: Options) {
  const { isNewThreadRoute } = useRouteIds();
  const { pendingThreads } = usePendingThreads();
  const {
    data,
    error,
    isError,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteThreads(workspaceId, { pageSize });

  const threadsFromQuery = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const displayThreads = useMemo(() => {
    const fromQuery = threadsFromQuery.filter(
      (t) => !pendingThreads.some((p) => p.id === t.id)
    );
    if (!isNewThreadRoute) return [...pendingThreads, ...fromQuery];
    const newThreadRow = makeNewThreadRow(workspaceId);
    return [newThreadRow, ...pendingThreads, ...fromQuery];
  }, [workspaceId, isNewThreadRoute, pendingThreads, threadsFromQuery]);

  const isInitialLoading = !workspaceId || isPending || (isFetching && !data);
  const firstThread = threadsFromQuery[0] ?? null;

  return {
    threads: displayThreads,
    firstThread,

    error,
    isError,
    isInitialLoading,
    isFetchingNextPage,
    hasNextPage,

    fetchNextPage,
    refetch,
  };
}
