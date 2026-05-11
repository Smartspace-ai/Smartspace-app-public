import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  clearPendingThreadUsers,
  getPendingThreadUsers,
} from './pendingThreadUsers';
import { addThreadUser } from './service';

type MaybeSendVars = {
  workspaceId?: unknown;
  threadId?: unknown;
  contentList?: unknown;
};

function isSendMessageVariables(
  v: unknown
): v is { workspaceId: string; threadId: string } {
  if (!v || typeof v !== 'object') return false;
  const vars = v as MaybeSendVars;
  return (
    typeof vars.workspaceId === 'string' &&
    typeof vars.threadId === 'string' &&
    'contentList' in vars
  );
}

/**
 * Drains any users staged in `pendingThreadUsers` for a draft thread once its
 * first message has been successfully posted (i.e. the thread now exists on
 * the server). Subscribes to the React Query mutation cache and detects
 * `useSendMessage` mutations by variables shape, since the chat-ui mutation
 * is not registered with a stable `mutationKey`.
 */
export function useDrainPendingThreadUsersOnSend(): void {
  const qc = useQueryClient();

  useEffect(() => {
    const seen = new WeakSet<object>();
    return qc.getMutationCache().subscribe((event) => {
      const mutation = event.mutation;
      if (!mutation) return;
      if (mutation.state.status !== 'success') return;
      if (seen.has(mutation)) return;
      const vars = mutation.state.variables;
      if (!isSendMessageVariables(vars)) return;
      seen.add(mutation);

      const { threadId } = vars;
      const pending = getPendingThreadUsers(threadId);
      if (pending.length === 0) return;
      clearPendingThreadUsers(threadId);
      for (const userId of pending) {
        addThreadUser(threadId, userId).catch((err) => {
          console.error('Failed to add pending thread user', userId, err);
        });
      }
    });
  }, [qc]);
}
