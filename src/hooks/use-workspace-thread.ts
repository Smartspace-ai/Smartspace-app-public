
import { fetchThread, fetchThreadVariables, updateVariable } from '@/apis/message-threads';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMatch } from '@tanstack/react-router';
import { toast } from 'sonner';
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
  });

  return threadQuery;
}


export function useThreadVariables({threadId}: { threadId?: string }) {
  return useQuery({
    queryKey: ['thread', threadId, 'variables'],
    enabled: !!threadId,
    queryFn: async () => {
      try {
        return await fetchThreadVariables(threadId!);
      } catch (error: any) {
        const code = error?.response?.data?.code || error?.code;
        if (code === 'MT404') {
          return {} as Record<string, any>;
        }
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      const code = error?.response?.data?.code || error?.code;
      return code !== 'MT404' && failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });
}

export function useUpdateVariable() {
  return useMutation({
    mutationFn: async ({
      flowRunId,
      variableName,
      value
    }: {
      flowRunId: string;
      variableName: string;
      value: any;
    }) => {
      await updateVariable(flowRunId, variableName, value);
    },
    onError: (error) => {
      console.error('Failed to update variable:', error);
      toast.error('Failed to update variable');
      throw error;
    },
  });
}


export function useActiveThread() {
  const threadMatch = useMatch({ from: '/_protected/workspace/$workspaceId/thread/$threadId', shouldThrow: false });
  const workspaceId = threadMatch?.params?.workspaceId;
  const threadId = threadMatch?.params?.threadId;

  return useWorkspaceThread({ workspaceId, threadId });
}
