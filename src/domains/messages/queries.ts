import { queryOptions, useQuery } from '@tanstack/react-query';

import type { Message } from './model';
import { messagesKeys } from './queryKeys';
import { fetchMessages } from './service';

const DEFAULT_MESSAGES_TAKE = 100;

export const messagesListOptions = (
  threadId: string,
  opts?: { take?: number; skip?: number }
) =>
  queryOptions<Message[]>({
    queryKey: threadId ? messagesKeys.list(threadId) : messagesKeys.lists(),
    // NOTE: queryKey intentionally does NOT include opts. This keeps cache updates from
    // message mutations (which write to messagesKeys.list(threadId)) working.
    // If opts changes (e.g. user clicks "Load full history"), we manually refetch.
    queryFn: async () =>
      (await fetchMessages(threadId, opts ?? { take: DEFAULT_MESSAGES_TAKE })).reverse(),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Avoid re-fetching the entire thread on every small navigation.
    staleTime: 30_000,
  });

export function useMessages(
  threadId: string,
  opts?: { take?: number; skip?: number }
) {
  return useQuery({ ...messagesListOptions(threadId, opts), enabled: !!threadId });
}
