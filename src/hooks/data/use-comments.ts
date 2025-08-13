
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getThreadComments,
  postThreadComment,
  getTaggableUsers,
} from '../../apis/comments';
import { Comment } from '../../models/comment';
import { MentionUser } from '../../models/mention-user';
import { toast } from 'sonner';

export const useQueryThreadComments = (threadId: string | null) => {
  const queryClient = useQueryClient();

  const queryComments = useQuery<Comment[], Error>({
    queryKey: ['comments', threadId],
    queryFn: async () => {
      if (!threadId) return Promise.reject('Thread ID is required');
      const response = await getThreadComments(threadId);
      const data = response.data.data as Comment[];
      return data.map((comment) => new Comment(comment)).reverse();
    },
    enabled: !!threadId,
    refetchOnWindowFocus: false,
  });


  const postCommentMutation = useMutation({
    mutationFn: async ({
      threadId,
      comment,
    }: {
      threadId: string | null;
      comment: Comment;
    }) => {
      const userIds = comment.mentionedUsers.map((user) => user.objectId);
      const uniqueUserIds = Array.from(new Set(userIds));
      const content = comment.content;
      if (!threadId) return Promise.reject('Thread ID is required');
      return await postThreadComment({
        threadId,
        content,
        userIds: uniqueUserIds as string[],
      });
    },
    onSuccess: async (response) => {
      const newComment = new Comment(response.data as Comment);
      queryClient.setQueryData(
        ['comments', threadId],
        (oldComments: Comment[] | [undefined]) => [
          ...(oldComments || []),
          { ...newComment, id: Date.now().toString(), optimistic: true },
        ],
      );
    },
    onError: (error) => {
      console.error(error);
      toast.error('There was an error posting your message');
      queryClient.invalidateQueries({
        queryKey: ['comments', threadId],
      });
    },
  });

  return { queryComments, postCommentMutation };
};


export const useTaggableWorkspaceUsers = (workspaceId: string) => {
  
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<MentionUser[]>({
    queryKey: ['workspace-users', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return Promise.reject('Workspace is required');
      const response = await getTaggableUsers(workspaceId);
      const data = response.data.data as MentionUser[];
      return data.map((user) => new MentionUser(user));
    },
    enabled: !!workspaceId,
  });

  return { users, isLoading, error };
};