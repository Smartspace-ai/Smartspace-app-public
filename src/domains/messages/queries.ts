import { queryOptions, useQuery } from '@tanstack/react-query';

import type { Message } from './model';
import { messagesKeys } from './queryKeys';
import { fetchMessages } from './service';

export const messagesListOptions = (threadId: string) =>
  queryOptions<Message[]>({
    queryKey: threadId ? messagesKeys.list(threadId) : messagesKeys.lists(),
    queryFn: async () => (await fetchMessages(threadId)).reverse(),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 8,
  });

export function useMessages(threadId: string) {
  return useQuery({ ...messagesListOptions(threadId), enabled: !!threadId });
}
