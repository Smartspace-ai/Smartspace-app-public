import { queryOptions, useQuery } from '@tanstack/react-query';

import { commentsKeys } from './queryKeys';
import { fetchComments } from './service';
import { isDraftThreadId } from '@/shared/utils/threadId';

export const commentsListOptions = (threadId: string) =>
  queryOptions({
    queryKey: commentsKeys.list(threadId),
    queryFn: () => fetchComments(threadId),
    refetchOnWindowFocus: false,
  });

export const useComments = (threadId: string) => {
  const isDraft = isDraftThreadId(threadId);
  return useQuery({
    ...commentsListOptions(threadId),
    enabled: !!threadId && !isDraft,
    // For draft threads, we want a fast, non-loading empty state (no backend fetch).
    initialData: isDraft ? [] : undefined,
  });
};
