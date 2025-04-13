import {
  createThread,
  deleteThread,
  fetchThreads,
  updateThread,
} from '@/apis/message-threads';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

// Import the context directly from the file
import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageThread } from '../models/message-threads';

export function useWorkspaceThreads() {
  const queryClient = useQueryClient();
  const { activeWorkspace, setActiveThread, activeThread } =
    useSmartSpaceChat();
  const navigate = useNavigate();
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [hoveredThreadId, setHoveredThreadId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const initialThreadSetRef = useRef<Record<string, boolean>>({});
  const { workspaceId, threadId } = useParams<{
    workspaceId: string;
    threadId?: string;
  }>();

  // Fetch threads for the active workspace
  const {
    data: threads = [],
    isLoading,
    error,
    refetch,
  } = useQuery<MessageThread[]>({
    queryKey: ['threads', activeWorkspace?.id],
    queryFn: () => fetchThreads(activeWorkspace?.id),
    enabled: !!activeWorkspace?.id,
  });

  // Create a new thread
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

  // Update a thread (e.g., toggle favorite)
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

  const deleteThreadMutation = useMutation({
    mutationFn: (threadId: string) => deleteThread(threadId),
    onSuccess: (_, threadId) => {
      // Remove the thread from the cache
      queryClient.setQueryData(
        ['threads', activeWorkspace?.id],
        (oldThreads: MessageThread[] = []) =>
          oldThreads.filter((thread) => thread.id !== threadId)
      );

      // If the deleted thread was active, clear it
      if (activeThread?.id === threadId) {
        setActiveThread(null);
      }
    },
  });

  const handleThreadChange = useCallback(
    (thread: MessageThread) => {
      // Create a stable reference to the thread to prevent issues with object identity
      const stableThread = { ...thread };

      // Set the active thread with the stable reference
      setActiveThread(stableThread);
      navigate(`/workspace/${activeWorkspace?.id}/thread/${stableThread.id}`, {
        replace: true,
      });
    },
    [activeWorkspace?.id, navigate, setActiveThread]
  );

  // Create a new thread
  const handleCreateThread = useCallback(() => {
    setIsCreatingThread(true);
  }, []);

  // Submit a new thread
  const handleSubmitThread = useCallback(
    (name: string) => {
      if (!activeWorkspace?.id || !name.trim()) return;
      createThreadMutation.mutate({ name, workspaceId: activeWorkspace.id });
    },
    [activeWorkspace?.id, createThreadMutation]
  );

  // Cancel thread creation
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

  // Update thread metadata (e.g., after adding a message)
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

  // Set initial thread when threads are loaded
  useEffect(() => {
    if (
      activeWorkspace?.id &&
      threads.length > 0 &&
      !activeThread &&
      !initialThreadSetRef.current[activeWorkspace.id]
    ) {
      let threadToSelect = threads[0];

      if (threadId) {
        const found = threads.find((thread) => thread.id === threadId);
        if (found) {
          threadToSelect = found;
        }
      }
      handleThreadChange(threadToSelect);
      // Mark that this workspace has had its initial thread set
      initialThreadSetRef.current[activeWorkspace.id] = true;
    }
  }, [
    activeWorkspace?.id,
    threads,
    activeThread,
    handleThreadChange,
    threadId,
  ]);

  return {
    threads,
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
