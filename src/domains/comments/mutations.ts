import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useUserId } from '@/platform/auth/session';

import { commentsKeys } from './queryKeys';
import { Comment, CommentSchema, MentionUser } from "./schemas";
import { addComment } from './service';


export function useAddComment(threadId: string) {
  const queryClient = useQueryClient();
  const activeUserId = useUserId();

  type AddCommentVariables = {
    threadId: string;
    content: string;
    mentionedUsers?: MentionUser[];
  };


  return useMutation<Comment, unknown, AddCommentVariables>({
    mutationKey: commentsKeys.mutation.add(threadId),
    mutationFn: async ({ threadId, content, mentionedUsers = [] }) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticComment = CommentSchema.parse({
        id: tempId,
        content,
        createdAt: new Date(),
        createdBy: activeUserId || 'You',
        createdByUserId: activeUserId,
        mentionedUsers,
        messageThreadId: threadId,
      });
  
      queryClient.setQueryData(
        commentsKeys.list(threadId),
        (old: Comment[] | undefined) => ([...(old ?? []), optimisticComment])
      );
  
      const realComment = await addComment(threadId, content, mentionedUsers);
  
      queryClient.setQueryData(
        commentsKeys.list(threadId),
        (old: Comment[] | undefined) => {
          const withoutTemp = (old ?? []).filter((c) => c.id !== tempId);
          return [...withoutTemp, realComment];
        }
      );
  
      return realComment;
    },
    onError: (_error, variables) => {
      queryClient.setQueryData(
        commentsKeys.list(variables.threadId),
        (old: Comment[] | undefined) => (old ?? []).filter((c) => !c.id.startsWith('temp-'))
      );
      console.error('Failed to add comment. Please try again.', _error);
      toast.error('Failed to add comment. Please try again.');
    },
  });

}





