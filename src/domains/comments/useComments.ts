import { useActiveUser } from '@/domains/users/use-active-user';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Comment, CommentSchema, MentionUser } from "./schemas";
import { addComment, fetchComments } from './service';


export function useComments(threadId: string) {
  const queryClient = useQueryClient();
  const activeUser = useActiveUser();
  const queryComments = useQuery({
    queryKey: ['comments', threadId],
    queryFn: async () => {
        return await fetchComments(threadId)
    },
    refetchOnWindowFocus: false,
  });


  // Add a comment with optimistic update
  type AddCommentVariables = {
    threadId: string;
    content: string;
    mentionedUsers?: MentionUser[];
  };

  const addCommentMutation = useMutation<Comment, unknown, AddCommentVariables>({
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

  return {
    queryComments, 
    addCommentMutation,
  };
}



