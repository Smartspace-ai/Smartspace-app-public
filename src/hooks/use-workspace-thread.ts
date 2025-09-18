
import { fetchThread } from '@/apis/message-threads';
import { useQuery } from '@tanstack/react-query';
import { useMatch } from '@tanstack/react-router';
import { useWorkspaceThreads } from './use-workspace-threads';

export function useWorkspaceThread({workspaceId, threadId}: { workspaceId?: string; threadId?: string }) {
  const { isLoading: threadsLoading } = useWorkspaceThreads();
  const threadQuery = useQuery({
    queryKey: ['workspace', workspaceId, 'thread', threadId],
    enabled: !!workspaceId && !!threadId && !threadsLoading,
    queryFn: async () => {
      try {
        return await fetchThread(workspaceId!, threadId!);
      } catch (error: any) {
        const code = error?.response?.data?.code || error?.code;
        if (code === 'MT404') {
          // Treat not-found as a successful empty result to avoid retry loops
          return null as any;
        }
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      const code = error?.response?.data?.code || error?.code;
      return code !== 'MT404' && failureCount < 2;
    },
    refetchOnWindowFocus: false,
    staleTime: 8,
  });

  return threadQuery;
}



export function useActiveThread() {
  const threadMatch = useMatch({ from: '/_protected/workspace/$workspaceId/thread/$threadId', shouldThrow: false });
  const workspaceId = threadMatch?.params?.workspaceId;
  const threadId = threadMatch?.params?.threadId;

  return useWorkspaceThread({ workspaceId, threadId });
}
