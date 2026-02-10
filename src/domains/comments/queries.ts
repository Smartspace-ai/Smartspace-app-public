import { queryOptions, useQuery } from '@tanstack/react-query';

import { isDraftThreadId } from '@/shared/utils/threadId';

import { commentsKeys } from './queryKeys';
import { fetchComments } from './service';

export const commentsListOptions = (threadId: string) =>
  queryOptions({
    queryKey: commentsKeys.list(threadId),
    queryFn: () => fetchComments(threadId),
    refetchOnWindowFocus: false,
  });

export const useComments = (
  threadId: string,
  opts?: { skipWhenNewThread?: boolean }
) => {
  const isDraft = isDraftThreadId(threadId);
  const skipFetch = opts?.skipWhenNewThread || !threadId || isDraft;
  return useQuery({
    ...commentsListOptions(threadId),
    enabled: !opts?.skipWhenNewThread && !!threadId && !isDraft,
    initialData: skipFetch ? [] : undefined,
  });
};
