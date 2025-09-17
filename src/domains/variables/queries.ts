import { useQuery } from '@tanstack/react-query';
import { threadVariablesKey } from './queryKeys';
import { fetchThreadVariables } from './service';

export function useThreadVariables(threadId?: string) {
  return useQuery({
    queryKey: threadVariablesKey(threadId ?? ''),
    enabled: !!threadId,
    queryFn: () => fetchThreadVariables(threadId!),
    staleTime: 30_000,
  });
}
