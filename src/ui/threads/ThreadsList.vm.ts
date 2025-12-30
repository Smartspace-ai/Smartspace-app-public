// src/ui/threads/useThreadsList.vm.ts
import { useInfiniteThreads } from '@/domains/threads';
import { useEffect } from 'react';

import { isDraftThreadId, unmarkDraftThreadId } from '@/shared/utils/threadId';


type Options = {
  workspaceId: string;
  pageSize?: number;
};

export function useThreadsListVm({workspaceId,  pageSize = 30 }: Options) {

  const {
    data,
    error,
    isError,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteThreads(workspaceId, { pageSize });
  const threads = data?.pages.flatMap(page => page.data) ?? [];
  const isInitialLoading = isLoading || (isFetching && !data);
  const firstThread = threads[0] ?? null;

  // If a thread exists in the server list, it's not a client-only draft anymore.
  // This prevents cases where a real thread (e.g. "Hello") is still marked draft
  // and therefore hides the "..." menu + disables fetching.
  useEffect(() => {
    for (const t of threads) {
      if (!t?.id) continue;
      if (!isDraftThreadId(t.id)) continue;

      // Our draft threads are created with empty user ids; server threads should have these populated.
      const looksServerBacked =
        typeof (t as any).createdByUserId === 'string' &&
        (t as any).createdByUserId.trim().length > 0;

      if (looksServerBacked) unmarkDraftThreadId(t.id);
    }
  }, [threads]);

  return {
    // data
    threads,
    firstThread,

    // state
    error,
    isError,
    isInitialLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,

    // actions
    fetchNextPage,
    refetch,
  };
}
