'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import { useContext, useEffect, useRef } from 'react';

import { toast } from 'sonner';
import { addComment, fetchComments } from '../apis/message-comments';
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

  // Fetch comments for the active thread
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

  // Effect to refetch comments when thread changes - with protection against loops
  useEffect(() => {
    if (activeThread?.id && activeThread.id !== previousThreadIdRef.current) {
      console.log(
        'Thread changed, refetching comments for thread ID:',
        activeThread.id
      );
      previousThreadIdRef.current = activeThread.id;

      // Only refetch if we have a valid thread ID and it's different from the previous one
      refetch().catch((error) => {
        console.error('Error refetching comments:', error);
      });
    }
  }, [activeThread?.id, refetch]);

  // Mutation to add a new comment with optimistic updates
  const addCommentMutation = useMutation({
    mutationFn: async ({
      threadId,
      content,
    }: {
      threadId: string;
      content: string;
    }) => {
      const optimisticComment = new MessageComment({
        id: `temp-${Date.now()}`,
        content,
        createdAt: new Date(),
        createdBy: activeUser.name || 'You',
        createdByUserId: 'current-user-id',
        mentionedUsers: [],
      } as MessageComment);

      // Add a flag to identify it as optimistic
      (optimisticComment as any).optimistic = true;

      // Add the optimistic comment to the cache
      queryClient.setQueryData(
        ['comments', threadId],
        (old: MessageComment[] = []) => [...old, optimisticComment]
      );

      // Do the actual mutation
      const realComment = await addComment(threadId, content);

      // Replace the optimistic comment with the real one
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
    addComment: async (content: string) => {
      if (!activeThread || !content.trim()) return;
      return await addCommentMutation.mutateAsync({
        threadId: activeThread.id,
        content,
      });
    },
    isAddingComment: addCommentMutation.isPending,
  };
}
