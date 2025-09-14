
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateVariable } from './service';


export function useUpdateVariable() {
  return useMutation({
    mutationFn: async ({
      flowRunId,
      variableName,
      value
    }: {
      flowRunId: string;
      variableName: string;
      value: unknown;
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


