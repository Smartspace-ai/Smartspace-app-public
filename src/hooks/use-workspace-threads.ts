import {
  createThread,
  deleteThread,
  fetchThreads,
  updateThread,
} from '@/apis/message-threads';

import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MessageThread } from '../models/message-threads';

export function useWorkspaceThreads(take = 20) {
  const queryClient = useQueryClient();
  const { activeWorkspace, setActiveThread, activeThread } =
    useSmartSpaceChat();
  const navigate = useNavigate();

  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [hoveredThreadId, setHoveredThreadId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const initialThreadSetRef = useRef<Record<string, boolean>>({});
  const { threadId } = useParams<{
    workspaceId: string;
    threadId?: string;
  }>();

  const [searchParams] = useSearchParams();
  const isNewThread = searchParams.get('isNew') === 'true';

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

  const flattenedThreads = useMemo(() => 
    data?.pages.flatMap((page) => page.threads) ?? [],
    [data]
  );

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
      queryClient.setQueryData(
        ['threads', activeWorkspace?.id],
        (oldThreads: MessageThread[] = []) => [newThread, ...oldThreads]
      );
      setActiveThread(newThread);
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
    onSuccess: (updatedThread) => {
      queryClient.setQueryData(
        ['threads', activeWorkspace?.id],
        (oldThreads: MessageThread[] = []) =>
          oldThreads.map((thread) =>
            thread.id === updatedThread.id ? updatedThread : thread
          )
      );
    },
  });

  // Delete a thread and remove it from state
  const deleteThreadMutation = useMutation({
    mutationFn: (threadId: string) => deleteThread(threadId),
    onSuccess: (_, threadId) => {
      queryClient.setQueryData(
        ['threads', activeWorkspace?.id],
        (oldThreads: MessageThread[] = []) =>
          oldThreads.filter((thread) => thread.id !== threadId)
      );
      if (activeThread?.id === threadId) {
        setActiveThread(null);
      }
    },
  });

  // Set active thread and navigate to it
  const handleThreadChange = useCallback(
    (thread: MessageThread) => {
      const stableThread = { ...thread };
      setActiveThread(stableThread);
      navigate(`/workspace/${activeWorkspace?.id}/thread/${stableThread.id}`, {
        replace: true,
      });
    },
    [activeWorkspace?.id, navigate, setActiveThread]
  );

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
        (oldThreads: MessageThread[] = []) =>
          oldThreads.map((thread) =>
            thread.id === threadId ? { ...thread, ...updates } : thread
          )
      );
    },
    [activeWorkspace?.id, queryClient]
  );

  // Set the initial active thread once threads are available
  useEffect(() => {
    const isValidThreadId = threadId && flattenedThreads.some((t) => t.id === threadId);

    if (
      activeWorkspace?.id &&
      flattenedThreads.length > 0 &&
      !activeThread &&
      !initialThreadSetRef.current[activeWorkspace.id] &&
      !isNewThread
    ) {
      // Set matched thread or fallback to first
      const threadToSelect = isValidThreadId
        ? flattenedThreads.find((t) => t.id === threadId) || flattenedThreads[0]
        : flattenedThreads[0];

      handleThreadChange(threadToSelect);
      initialThreadSetRef.current[activeWorkspace.id] = true;
    }
  }, [
    activeWorkspace?.id,
    flattenedThreads,
    activeThread,
    handleThreadChange,
    threadId,
    isNewThread,
  ]);

  return {
    threads: flattenedThreads,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    totalCount: data?.pages?.[0]?.total ?? flattenedThreads.length,
    isLoading,
    error,
    refetch,
    activeThread,
    isCreatingThread,
    hoveredThreadId,
    setHoveredThreadId,
    openMenuId,
    setOpenMenuId,
    handleThreadChange,
    handleCreateThread,
    handleSubmitThread,
    handleCancelThread,
    handleToggleFavorite,
    updateThreadMetadata,
    handleDeleteThread: (threadId: string) =>
      deleteThreadMutation.mutate(threadId),
  };
}
