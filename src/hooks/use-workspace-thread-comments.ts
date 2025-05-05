import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContext, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { MentionUser } from '@/models/mention-user';
import { addComment, fetchComments, fetchTaggableUsers } from '../apis/message-comments';
import { MessageComment } from '../models/message-comment';
import { UserContext } from './use-user-information';

export function useWorkspaceThreadComments() {
  const { activeThread } = useSmartSpaceChat();
  const queryClient = useQueryClient();
  const previousThreadIdRef = useRef<string | null>(null);
  const { graphData, graphPhoto } = useContext(UserContext);

  const activeUser = {
    name: graphData?.displayName ?? 'User',
    email: graphData?.mail ?? '',
    profilePhoto: graphPhoto || '',
  };

  // Fetch comments for the current thread
  const {
    data: comments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['comments', activeThread?.id],
    queryFn: () =>
      activeThread ? fetchComments(activeThread.id) : Promise.resolve([]),
    enabled: !!activeThread,
  });

  // Refetch comments when the thread changes
  useEffect(() => {
    if (activeThread?.id && activeThread.id !== previousThreadIdRef.current) {
      previousThreadIdRef.current = activeThread.id;

      refetch().catch((error) => {
        console.error('Error refetching comments:', error);
      });
    }
  }, [activeThread?.id, refetch]);

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
      if (!activeThread || !content.trim()) return;
      return await addCommentMutation.mutateAsync({
        threadId: activeThread.id,
        content,
        mentionedUsers
      });
    },
    isAddingComment: addCommentMutation.isPending,
  };
}

export const useTaggableWorkspaceUsers = () => {
  const { activeWorkspace } = useSmartSpaceChat();

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