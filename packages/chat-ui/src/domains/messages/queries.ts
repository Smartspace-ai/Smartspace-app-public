import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';

import { useChatService } from '@/platform/chat';
import type { ChatService } from '@/platform/chat';

import { isDraftThreadId } from '@/shared/utils/threadId';

import type { Message } from './model';
import { messagesKeys } from './queryKeys';

export const messagesListOptions = (
  service: ChatService,
  threadId: string,
  opts?: { take?: number; skip?: number }
) =>
  queryOptions<Message[]>({
    queryKey: threadId ? messagesKeys.list(threadId) : messagesKeys.lists(),
    // NOTE: queryKey intentionally does NOT include opts. This keeps cache updates from
    // message mutations (which write to messagesKeys.list(threadId)) working.
    // If opts changes (e.g. user clicks "Load full history"), we manually refetch.
    queryFn: async () => {
      if (!threadId) return [];
      // Server is the source of truth. The send mutation cancels in-flight
      // refetches before POSTing so its `[realMessage]` write isn't races by
      // a stale fetch landing afterwards.
      return (await service.fetchMessages(threadId, opts)).reverse();
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Avoid re-fetching the entire thread on every small navigation.
    staleTime: 30_000,
  });

export function useMessages(threadId: string) {
  const service = useChatService();
  const isDraft = isDraftThreadId(threadId);
  return useQuery({
    ...messagesListOptions(service, threadId),
    enabled: !!threadId && !isDraft,
    initialData: !threadId || isDraft ? [] : undefined,
  });
}

const DEFAULT_MESSAGES_PAGE_SIZE = 50;

/**
 * Infinite query options for loading older messages (offset-based).
 * Page 0 = most recent; fetchPreviousPage loads older (page 1, 2, ...).
 */
export function messagesInfiniteOptions(
  service: ChatService,
  threadId: string,
  pageSize = DEFAULT_MESSAGES_PAGE_SIZE
) {
  return infiniteQueryOptions({
    queryKey: messagesKeys.infinite(threadId),
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const fetched = await service.fetchMessages(threadId, {
        take: pageSize,
        skip: pageParam * pageSize,
      });
      return fetched.reverse();
    },
    initialPageParam: 0,
    getNextPageParam: () => undefined,
    getPreviousPageParam: (
      firstPage: Message[],
      _allPages: Message[][],
      firstPageParam: number
    ) => (firstPage.length < pageSize ? undefined : firstPageParam + 1),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
  });
}

/**
 * Hook for infinite messages (load older via fetchPreviousPage).
 * Flattens pages so oldest is first; use for prepend/scroll-to-top UX.
 */
export function useInfiniteMessages(
  threadId: string,
  pageSize = DEFAULT_MESSAGES_PAGE_SIZE,
  opts?: { skipWhenNewThread?: boolean }
) {
  const service = useChatService();
  const isDraft = isDraftThreadId(threadId);
  return useInfiniteQuery({
    ...messagesInfiniteOptions(service, threadId, pageSize),
    enabled: !opts?.skipWhenNewThread && !!threadId && !isDraft,
  });
}
