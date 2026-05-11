import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useChatService } from '@/platform/chat';

import { isDraftThreadId } from '@/shared/utils/threadId';

import { flowRunsKeys } from './queryKeys';

/**
 * Patch a single flow-run variable. Called per-change by the chat
 * variables form. Skips writes for draft threads (no flow-run yet)
 * and invalidates the matching variables cache on success.
 */
export function useUpdateFlowRunVariable() {
  const qc = useQueryClient();
  const service = useChatService();
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
      if (isDraftThreadId(flowRunId)) return;
      await service.updateFlowRunVariable({
        flowRunId,
        name: variableName,
        value,
      });
    },
    onSuccess: (_data, variables) => {
      if (variables?.flowRunId) {
        qc.invalidateQueries({
          queryKey: flowRunsKeys.variables(variables.flowRunId),
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update variable:', error);
      toast.error('Failed to update variable');
      throw error;
    },
  });
}
