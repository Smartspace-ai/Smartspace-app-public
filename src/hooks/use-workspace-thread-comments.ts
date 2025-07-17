import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { MentionUser } from '@/models/mention-user';
import { addComment, fetchComments, fetchTaggableUsers } from '../apis/message-comments';
import { MessageComment } from '../models/message-comment';
import { useActiveUser } from './use-active-user';
import { useActiveWorkspace } from './use-workspaces';

export function useWorkspaceThreadComments(threadId?: string) {
  const queryClient = useQueryClient();
  const previousThreadIdRef = useRef<string | null>(null);
    const activeUser = useActiveUser();

  // Fetch comments for the current thread
  const {
    data: comments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['comments', threadId],
    queryFn: () =>
      threadId ? fetchComments(threadId) : Promise.resolve([]),
    enabled: !!threadId,
  });

  // Refetch comments when the thread changes
  useEffect(() => {
    if (threadId !== previousThreadIdRef.current) {
      previousThreadIdRef.current = threadId;

      refetch().catch((error) => {
        console.error('Error refetching comments:', error);
      });
    }
  }, [threadId, refetch]);

  // Add a comment with optimistic update
  const addCommentMutation = useMutation({
    mutationFn: async ({
      threadId,
      content,
      mentionedUsers = [],
    }: {
      threadId: string;
      content: string;
      mentionedUsers?: MentionUser[];
    }) => {
      const optimisticComment = new MessageComment({
        id: `temp-${Date.now()}`,
        content,
        createdAt: new Date(),
        createdBy: activeUser.name || 'You',
        createdByUserId: 'current-user-id',
        mentionedUsers,
      } as MessageComment);
  
      (optimisticComment as any).optimistic = true;
  
      queryClient.setQueryData(
        ['comments', threadId],
        (old: MessageComment[] = []) => [...old, optimisticComment]
      );
  
      const realComment = await addComment(threadId, content, mentionedUsers);
  
      queryClient.setQueryData(
        ['comments', threadId],
        (old: MessageComment[] = []) => {
          return old.filter((c) => !(c as any).optimistic).concat(realComment);
        }
      );
  
      return realComment;
    },
    onError: (_error, variables) => {
      queryClient.setQueryData(
        ['comments', variables.threadId],
        (old: MessageComment[] = []) =>
          old.filter((c) => !(c as any).optimistic)
      );
      toast.error('Failed to add comment. Please try again.');
    },
  });

  return {
    comments,
    isLoading,
    error,
    refetch,
    addComment: async (content: string, mentionedUsers: MentionUser[] = []) => {
      if (!threadId || !content.trim()) return;
      return await addCommentMutation.mutateAsync({
        threadId,
        content,
        mentionedUsers
      });
    },
    isAddingComment: addCommentMutation.isPending,
  };
}

export const useTaggableWorkspaceUsers = () => {
  const activeWorkspace = useActiveWorkspace();

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<MentionUser[]>({
    queryKey: ['workspace-users', activeWorkspace?.id],
    queryFn: () =>
      activeWorkspace
        ? fetchTaggableUsers(activeWorkspace.id)
        : Promise.resolve([]),
    enabled: !!activeWorkspace?.id,
  });

  return { users, isLoading, error };
};