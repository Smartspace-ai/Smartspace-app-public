import { queryOptions, useQuery } from '@tanstack/react-query';

import { flowRunsKeys } from './queryKeys';
import { fetchFlowRunVariables } from './service';

export const flowRunVariablesOptions = (flowRunId: string) =>
  queryOptions({
    queryKey: flowRunsKeys.variables(flowRunId ?? ''),
    queryFn: () => fetchFlowRunVariables(flowRunId!),
    staleTime: 30_000,
  });

export function useFlowRunVariables(flowRunId?: string) {
  return useQuery({ ...flowRunVariablesOptions(flowRunId ?? ''), enabled: !!flowRunId });
}


