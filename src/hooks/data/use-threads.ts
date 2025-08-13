import { getMessageThreads } from "@/apis/threads";
import { MessageThread } from "@/models/message-thread";
import { PaginationParams } from "@/models/react-query-params";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

export const useQueryThreads = ({
  take,
  skip,
}: PaginationParams) => {
  const params = useParams();
  const queryThreads = useInfiniteQuery({
    queryKey: ['threads', params.workspaceId, take],
    enabled: !!params.workspaceId,
    initialPageParam: skip ?? 0,
    queryFn: async ({ pageParam }) => {
      if (!params.workspaceId) throw new Error('Workspace is null');

      const res = await getMessageThreads(params.workspaceId, {
        take: take,
        skip: typeof pageParam === 'number' ? pageParam : 0,
      });

      const threads = res.data.data as MessageThread[];
      const total = res.data.total as number;
      return { data: threads, total };

    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const currentSkip = typeof lastPageParam === 'number' ? lastPageParam : 0;
      const nextSkip = currentSkip + take;
      return nextSkip < (lastPage?.total ?? 0) ? nextSkip : undefined;
    },
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
      const currentSkip = typeof firstPageParam === 'number' ? firstPageParam : 0;
      const prevSkip = Math.max(0, currentSkip - take);
      return currentSkip > 0 ? prevSkip : undefined;
    }
  });
  return { queryThreads };
};