import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { ThreadUser } from './model';
import { threadUsersKeys } from './queryKeys';
import { addThreadUser, removeThreadUser } from './service';

type Vars = { userId: string; user?: Pick<ThreadUser, 'displayName'> };

/**
 * Add a single user to a thread. Optimistically updates the thread-users list
 * cache and rolls back on error. Consumers should read the current membership
 * via `useThreadUsers` — this hook does not track selection state.
 */
export function useAddThreadUser(threadId: string | null | undefined) {
  const qc = useQueryClient();
  const listKey = threadUsersKeys.list(threadId ?? '');

  return useMutation<void, Error, Vars, { previous?: ThreadUser[] }>({
    mutationKey: threadUsersKeys.addUser(threadId ?? ''),
    mutationFn: async ({ userId }) => {
      if (!threadId) throw new Error('Thread ID is required');
      await addThreadUser(threadId, userId);
    },
    onMutate: async ({ userId, user }) => {
      if (!threadId) return {};
      await qc.cancelQueries({ queryKey: listKey });
      const previous = qc.getQueryData<ThreadUser[]>(listKey);
      qc.setQueryData<ThreadUser[]>(listKey, (old = []) => {
        if (old.some((u) => u.userId === userId)) return old;
        return [
          ...old,
          {
            id: userId,
            userId,
            displayName: user?.displayName ?? '',
            emailAddress: null,
          },
        ];
      });
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(listKey, ctx.previous);
      console.error('Failed to add thread user:', error);
      toast.error('Failed to add user to thread');
    },
    onSettled: () => {
      if (!threadId) return;
      qc.invalidateQueries({ queryKey: listKey });
    },
  });
}

/**
 * Remove a single user from a thread. Optimistically updates the thread-users
 * list cache and rolls back on error.
 */
export function useRemoveThreadUser(threadId: string | null | undefined) {
  const qc = useQueryClient();
  const listKey = threadUsersKeys.list(threadId ?? '');

  return useMutation<void, Error, Vars, { previous?: ThreadUser[] }>({
    mutationKey: threadUsersKeys.removeUser(threadId ?? ''),
    mutationFn: async ({ userId }) => {
      if (!threadId) throw new Error('Thread ID is required');
      await removeThreadUser(threadId, userId);
    },
    onMutate: async ({ userId }) => {
      if (!threadId) return {};
      await qc.cancelQueries({ queryKey: listKey });
      const previous = qc.getQueryData<ThreadUser[]>(listKey);
      qc.setQueryData<ThreadUser[]>(listKey, (old = []) =>
        old.filter((u) => u.userId !== userId)
      );
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(listKey, ctx.previous);
      console.error('Failed to remove thread user:', error);
      toast.error('Failed to remove user from thread');
    },
    onSettled: () => {
      if (!threadId) return;
      qc.invalidateQueries({ queryKey: listKey });
    },
  });
}
