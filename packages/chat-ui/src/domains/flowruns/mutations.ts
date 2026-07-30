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
/**
 * Request cancellation of a thread's running flow (thread id == flow-run id).
 * No-op for draft threads and for services that don't implement
 * `cancelFlowRun`. The running state clears via the thread SSE when the
 * engine actually stops — no cache invalidation needed here.
 */
export function useCancelFlowRun() {
  const service = useChatService();
  return useMutation({
    mutationKey: flowRunsKeys.cancel(),
    mutationFn: async (flowRunId: string) => {
      if (isDraftThreadId(flowRunId)) return;
      await service.cancelFlowRun?.(flowRunId);
    },
    onError: (error) => {
      console.error('Failed to cancel flow run:', error);
      toast.error('Failed to stop the run');
    },
  });
}

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
