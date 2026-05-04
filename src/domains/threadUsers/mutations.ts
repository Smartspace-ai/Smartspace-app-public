import { useMutation, useQueryClient } from '@tanstack/react-query';

import { threadUsersKeys } from './queryKeys';
import { updateThreadUsers } from './service';

export function useUpdateThreadUsers(threadId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: threadUsersKeys.updateUsers(threadId),
    mutationFn: (userIds: string[]) => updateThreadUsers(threadId, userIds),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: threadUsersKeys.list(threadId) });
    },
  });
}
