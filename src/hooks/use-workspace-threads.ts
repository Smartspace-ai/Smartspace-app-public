import {
  createThread,
  deleteThread,
  fetchThreads,
  updateThread,
} from '@/apis/message-threads';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageThread } from '../models/message-threads';
import { useWorkspaces } from './use-workspaces';

export function useWorkspaceThreads(take = 20) {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspaces();
  const navigate = useNavigate();

  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [hoveredThreadId, setHoveredThreadId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { threadId } = useParams<{
    threadId?: string;
  }>();

  // Fetch threads for the active workspace
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['threads', activeWorkspace?.id],
    enabled: !!activeWorkspace?.id,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!activeWorkspace?.id) throw new Error('No workspace ID');

      const res = await fetchThreads(activeWorkspace.id, {
        take,
        skip: pageParam,
      });

      const threads = res.threads;
      const total = res.total;

      return {
        threads: threads.map((t) => new MessageThread(t)),
        nextSkip: pageParam + take,
        hasMore: pageParam + take < total,
        total,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextSkip : undefined,
  });

  const flattenedThreads = data?.pages.flatMap((page) => page.threads);

  // Create a new thread and set it as active
  const createThreadMutation = useMutation({
    mutationFn: ({
      name,
      workspaceId,
    }: {
      name: string;
      workspaceId: string;
    }) => createThread(name, workspaceId),
    onSuccess: (newThread) => {
      refetch();
      navigate(`/workspace/${activeWorkspace?.id}/thread/${newThread.id}`);
      setIsCreatingThread(false);
    },
  });

  // Update a thread (e.g. toggle favorite)
  const updateThreadMutation = useMutation({
    mutationFn: ({
      threadId,
      updates,
    }: {
      threadId: string;
      updates: Partial<MessageThread>;
    }) => updateThread(threadId, updates),
    onSuccess: () => {
      refetch();
    },
  });

  // Delete a thread and remove it from state
  const deleteThreadMutation = useMutation({
    mutationFn: (deletedThreadId: string) => deleteThread(deletedThreadId),
    onSuccess: (_, deletedThreadId) => {
      refetch();
      if (threadId === deletedThreadId) {
        navigate(`/workspace/${activeWorkspace?.id}`);
      }
    },
  });

  // Trigger UI for new thread creation
  const handleCreateThread = useCallback(() => {
    setIsCreatingThread(true);
  }, []);

  // Submit new thread to API
  const handleSubmitThread = useCallback(
    (name: string) => {
      if (!activeWorkspace?.id || !name.trim()) return;
      createThreadMutation.mutate({ name, workspaceId: activeWorkspace.id });
    },
    [activeWorkspace?.id, createThreadMutation]
  );

  // Cancel creation flow
  const handleCancelThread = useCallback(() => {
    setIsCreatingThread(false);
  }, []);

  // Toggle thread favorite status
  const handleToggleFavorite = useCallback(
    (thread: MessageThread) => {
      updateThreadMutation.mutate({
        threadId: thread.id,
        updates: { favorited: !thread.favorited },
      });
    },
    [updateThreadMutation]
  );

  // Update thread data in cache (e.g. after posting a message)
  const updateThreadMetadata = useCallback(
    (threadId: string, updates: Partial<MessageThread>) => {
      if (!activeWorkspace?.id) return;

      queryClient.setQueryData(
        ['threads', activeWorkspace.id],
        (oldThreads: {pages: {threads: MessageThread[]}[]}) => {
          return {
            ...oldThreads,
            pages: oldThreads.pages.map((page) => ({
              ...page,
              threads: page.threads.map((thread) =>
                thread.id === threadId ? { ...thread, ...updates } : thread
              ),
            })),
          };
        }
      );
    },
    [activeWorkspace?.id, queryClient]
  );

  return {
    threads: flattenedThreads,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    totalCount: data?.pages?.[0]?.total ?? flattenedThreads?.length,
    isLoading,
    error,
    refetch,
    isCreatingThread,
    hoveredThreadId,
    setHoveredThreadId,
    openMenuId,
    setOpenMenuId,
    handleCreateThread,
    handleSubmitThread,
    handleCancelThread,
    handleToggleFavorite,
    updateThreadMetadata,
    handleDeleteThread: (threadId: string) =>
      deleteThreadMutation.mutate(threadId),
  };
}
