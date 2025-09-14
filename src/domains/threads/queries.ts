
import { useQuery } from '@tanstack/react-query';
import { threadsKeys } from './queryKeys';
import { fetchThread, fetchThreadVariables } from './service';

export const useThread = ({workspaceId, threadId}: { workspaceId: string; threadId: string }) => {
  return useQuery({
    queryKey: threadsKeys.detail(workspaceId, threadId),
    enabled: !!workspaceId && !!threadId,
    queryFn: async () => {
        return await fetchThread(workspaceId, threadId);
    },
    refetchOnWindowFocus: false,
  });
}


export function useThreadVariables({threadId}: { threadId: string }) {
  return useQuery({
    queryKey: threadsKeys.variables(threadId),
    enabled: !!threadId,
    queryFn: async () => {
        return await fetchThreadVariables(threadId);
     
    },
    refetchOnWindowFocus: false,
  });
}

