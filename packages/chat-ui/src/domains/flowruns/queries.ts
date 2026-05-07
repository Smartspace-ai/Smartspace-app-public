import { queryOptions, useQuery } from '@tanstack/react-query';

import { useChatService } from '@/platform/chat';

import { flowRunsKeys } from './queryKeys';

/**
 * Read the current flow-run variable values for a thread. The chat
 * variables form seeds initial UI state from this and rerenders when
 * the cache invalidates.
 */
export function useFlowRunVariables(flowRunId?: string) {
  const service = useChatService();
  return useQuery({
    ...queryOptions({
      queryKey: flowRunsKeys.variables(flowRunId ?? ''),
      queryFn: () => service.fetchFlowRunVariables(flowRunId ?? ''),
      staleTime: 30_000,
    }),
    enabled: !!flowRunId,
  });
}
