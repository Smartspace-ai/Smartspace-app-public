import { useQuery } from '@tanstack/react-query';
import { flowRunsKeys } from './queryKeys';
import { fetchFlowRunVariables } from './service';

export function useFlowRunVariables(flowRunId?: string) {
  return useQuery({
    queryKey: flowRunsKeys.variables(flowRunId ?? ''),
    enabled: !!flowRunId,
    queryFn: () => fetchFlowRunVariables(flowRunId!),
    staleTime: 30_000,
  });
}


