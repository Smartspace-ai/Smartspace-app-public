import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { flowRunsKeys } from './queryKeys';
import { updateFlowRunVariable } from './service';

export function useUpdateFlowRunVariable() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: flowRunsKeys.updateVariable('', ''),
    mutationFn: async ({
      flowRunId,
      variableName,
      value,
    }: {
      flowRunId: string;
      variableName: string;
      value: unknown;
    }) => {
      await updateFlowRunVariable(flowRunId, variableName, value);
    },
    onSuccess: (_data, variables) => {
      if (variables?.flowRunId) {
        qc.invalidateQueries({ queryKey: flowRunsKeys.variables(variables.flowRunId) });
      }
    },
    onError: (error) => {
      console.error('Failed to update variable:', error);
      toast.error('Failed to update variable');
      throw error;
    },
  });
}


