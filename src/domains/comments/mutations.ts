import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useUserDisplayName, useUserId } from '@/platform/auth/session';

import type { Comment, MentionUser } from './model';
import { commentsKeys } from './queryKeys';
import { addComment } from './service';

export function useAddComment(threadId: string) {
  const queryClient = useQueryClient();
  const activeUserId = useUserId();
  const activeUserName = useUserDisplayName();

  type AddCommentVariables = {
    threadId: string;
    content: string;
    mentionedUsers?: MentionUser[];
  };

  type AddCommentContext = {
    threadId: string;
    tempId: string;
    previous?: Comment[];
  };

  return useMutation<Comment, unknown, AddCommentVariables, AddCommentContext>({
    mutationKey: commentsKeys.mutation.add(threadId),
    // Don't retry comment posts. Our app defaults to retry mutations once on transient failures,
    // which can create the appearance of "failed then sent again".
    retry: 0,
    mutationFn: async ({ threadId, content, mentionedUsers = [] }) => {
      return await addComment(threadId, content, mentionedUsers);
    },
    onMutate: async ({ threadId, content, mentionedUsers = [] }) => {
      await queryClient.cancelQueries({
        queryKey: commentsKeys.list(threadId),
      });

      const previous = queryClient.getQueryData<Comment[]>(
        commentsKeys.list(threadId)
      );
      const tempId = `temp-${crypto.randomUUID()}`;
      const optimisticComment: Comment = {
        id: tempId,
        content,
        createdAt: new Date(),
        createdBy: activeUserName || 'You',
        createdByUserId: activeUserId ?? '',
        mentionedUsers: mentionedUsers ?? [],
        messageThreadId: threadId,
      };

      queryClient.setQueryData(
        commentsKeys.list(threadId),
        (old: Comment[] | undefined) => [...(old ?? []), optimisticComment]
      );

      return { threadId, tempId, previous };
    },
    onSuccess: (realComment, variables, ctx) => {
      const tid = ctx?.threadId ?? variables.threadId;
      const tempId = ctx?.tempId;
      if (!tempId) return;

      queryClient.setQueryData(
        commentsKeys.list(tid),
        (old: Comment[] | undefined) => {
          const list = old ?? [];
          const tempIdx = list.findIndex((c) => c.id === tempId);
          const realIdx = list.findIndex((c) => c.id === realComment.id);

          // The SignalR `receiveCommentsUpdate` push can land before the POST
          // response. When it does, the real comment is already in the cache,
          // and naively replacing the placeholder would leave two copies.
          if (realIdx !== -1) {
            return tempIdx === -1 ? list : list.filter((c) => c.id !== tempId);
          }
          if (tempIdx === -1) return [...list, realComment];
          const next = list.slice();
          next[tempIdx] = realComment;
          return next;
        }
      );
    },
    onError: (_error, variables, ctx) => {
      // Roll back just this optimistic comment.
      if (ctx?.previous) {
        queryClient.setQueryData(commentsKeys.list(ctx.threadId), ctx.previous);
      } else if (ctx?.tempId) {
        queryClient.setQueryData(
          commentsKeys.list(variables.threadId),
          (old: Comment[] | undefined) =>
            (old ?? []).filter((c) => c.id !== ctx.tempId)
        );
      }
      // eslint-disable-next-line no-console
      console.error('Failed to add comment. Please try again.', _error);
      toast.error('Failed to add comment. Please try again.');
    },
  });
}
