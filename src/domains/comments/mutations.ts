import { useActiveUser } from '@/domains/users/use-active-user';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Comment, CommentSchema, MentionUser } from "./schemas";
import { addComment } from './service';


export function useAddComment(threadId: string) {
  const queryClient = useQueryClient();
  const activeUser = useActiveUser();

  type AddCommentVariables = {
    threadId: string;
    content: string;
    mentionedUsers?: MentionUser[];
  };


  return useMutation<Comment, unknown, AddCommentVariables>({
    mutationFn: async ({ threadId, content, mentionedUsers = [] }) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticComment = CommentSchema.parse({
        id: tempId,
        content,
        createdAt: new Date(),
        createdBy: activeUser.name || 'You',
        createdByUserId: activeUser.id,
        mentionedUsers,
        messageThreadId: threadId,
      });
  
      queryClient.setQueryData(
        ['comments', threadId],
        (old: Comment[] | undefined) => ([...(old ?? []), optimisticComment])
      );
  
      const realComment = await addComment(threadId, content, mentionedUsers);
  
      queryClient.setQueryData(
        ['comments', threadId],
        (old: Comment[] | undefined) => {
          const withoutTemp = (old ?? []).filter((c) => c.id !== tempId);
          return [...withoutTemp, realComment];
        }
      );
  
      return realComment;
    },
    onError: (_error, variables) => {
      queryClient.setQueryData(
        ['comments', variables.threadId],
        (old: Comment[] | undefined) => (old ?? []).filter((c) => !c.id.startsWith('temp-'))
      );
      toast.error('Failed to add comment. Please try again.');
    },
  });

}





