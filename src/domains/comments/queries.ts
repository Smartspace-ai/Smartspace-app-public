import { queryOptions, useQuery } from '@tanstack/react-query';

import { commentsKeys } from './queryKeys';
import { fetchComments } from './service';

export const commentsListOptions = (threadId: string) =>
  queryOptions({
    queryKey: commentsKeys.list(threadId),
    queryFn: () => fetchComments(threadId),
    refetchOnWindowFocus: false,
  });

export const useComments = (threadId: string) => useQuery(commentsListOptions(threadId));
