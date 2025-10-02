// src/ui/threads/useThreadsList.vm.ts
import { useInfiniteThreads } from '@/domains/threads';
import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';


type Options = {
  pageSize?: number;
  filters?: { search?: string; favorited?: boolean };
};

export function useThreadsListVm({  pageSize = 30, filters }: Options = {}) {

  const { workspaceId } = useRouteIds();

  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useInfiniteThreads(workspaceId, { pageSize });
  const threads = data?.pages.flatMap(page => page.data) ?? [];
  const isInitialLoading = isLoading || (isFetching && !data);
  const firstThread = threads[0] ?? null;

  return {
    // data
    threads,
    firstThread,

    // state
    isInitialLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,

    // actions
    fetchNextPage,
    refetch,
  };
}
