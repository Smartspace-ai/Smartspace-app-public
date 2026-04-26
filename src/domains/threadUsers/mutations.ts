import { useMutation, useQueryClient } from '@tanstack/react-query';

import { threadUsersKeys } from './queryKeys';
import { addThreadUser, removeThreadUser } from './service';

export function useAddThreadUser(threadId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: threadUsersKeys.addUser(threadId),
    mutationFn: async (userId: string) => addThreadUser(threadId, userId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: threadUsersKeys.list(threadId) });
    },
  });
}

export function useRemoveThreadUser(threadId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: threadUsersKeys.removeUser(threadId),
    mutationFn: async (userId: string) => removeThreadUser(threadId, userId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: threadUsersKeys.list(threadId) });
    },
  });
}
