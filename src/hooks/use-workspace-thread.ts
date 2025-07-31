
import { fetchThread, fetchThreadVariables, updateVariable } from '@/apis/message-threads';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

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


export function useThreadVariables({threadId}: { threadId?: string }) {
  return useQuery({
    queryKey: ['thread', threadId, 'variables'],
    enabled: !!threadId,
    queryFn: async () => {
      return fetchThreadVariables(threadId!);
    },
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


