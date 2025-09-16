import { useQuery } from '@tanstack/react-query';
import { messagesKeys } from './queryKeys';
import type { Message } from './schemas';
import { fetchMessages } from './service';

export function useMessages(threadId: string) {
  return useQuery({
    enabled: !!threadId,
    queryKey: threadId ? messagesKeys.list(threadId) : messagesKeys.lists(),
    queryFn: async (): Promise<Message[]> => {
      const result = await fetchMessages(threadId); // Zod-validated in service.ts
      // Oldest → newest (or flip if you prefer)
      return result.reverse();
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 8,
  });
}
