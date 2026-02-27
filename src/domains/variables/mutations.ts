import { useMutation, useQueryClient } from '@tanstack/react-query';
import { threadVariablesKey } from './queryKeys';
import { updateThreadVariable } from './service';

export function useUpdateVariable(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateThreadVariable,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: threadVariablesKey(threadId) });
    },
  });
}
