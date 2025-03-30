'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import { useEffect, useRef } from 'react';

import { toast } from 'sonner';
import { addComment, fetchComments } from '../apis/message-comments';
import { MessageComment } from '../models/message-comment';

export function useWorkspaceThreadComments() {
  const { activeThread } = useSmartSpaceChat();
  const queryClient = useQueryClient();
  const previousThreadIdRef = useRef<string | null>(null);

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
    mutationFn: ({
      threadId,
      content,
    }: {
      threadId: string;
      content: string;
    }) => {
      return new Promise<MessageComment>((resolve, reject) => {
        try {
          // Cancel any in-flight queries to avoid race conditions
          queryClient.cancelQueries({
            queryKey: ['comments', threadId],
          });

          // Create an optimistic comment
          const optimisticComment = new MessageComment({
            id: `temp-${Date.now()}`,
            content,
            createdAt: new Date(),
            createdBy: 'You',
            createdByUserId: 'current-user-id',
            mentionedUsers: [],
          } as MessageComment);

          // Add a flag to identify it as optimistic
          (optimisticComment as any).optimistic = true;

          // Add the optimistic comment to the cache
          queryClient.setQueryData(
            ['comments', threadId],
            (oldComments: MessageComment[] = []) => [
              ...oldComments,
              optimisticComment,
            ]
          );

          // Make the actual API call
          const response = addComment(threadId, content);

          // Update the cache with the real comment
          queryClient.setQueryData(
            ['comments', threadId],
            (oldComments: MessageComment[] = []) => {
              // Filter out the optimistic comment
              const filteredComments = oldComments.filter(
                (comment) => !(comment as any).optimistic
              );
              return [...filteredComments, response];
            }
          );

          resolve(response);
        } catch (error) {
          // Remove the optimistic comment on error
          queryClient.setQueryData(
            ['comments', threadId],
            (oldComments: MessageComment[] = []) =>
              oldComments.filter((comment) => !(comment as any).optimistic)
          );
          reject(error);
        }
      });
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment. Please try again.');
    },
  });

  return {
    comments,
    isLoading,
    error,
    refetch,
    addComment: (content: string) => {
      if (!activeThread || !content.trim()) return;
      return addCommentMutation.mutate({
        threadId: activeThread.id,
        content,
      });
    },
    isAddingComment: addCommentMutation.isPending,
  };
}
