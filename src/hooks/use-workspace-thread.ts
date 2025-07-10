
import { fetchThread } from '@/apis/message-threads';
import { useQuery } from '@tanstack/react-query';

export function useWorkspaceThread({workspaceId, threadId}: { workspaceId?: string; threadId?: string }) {
  const threadQuery = useQuery({
    queryKey: ['workspace', workspaceId, 'thread', threadId],
    enabled: !!workspaceId && !!threadId,
    queryFn: async () => {
      return fetchThread(workspaceId!, threadId!);
    },
  });

  return threadQuery;
}

