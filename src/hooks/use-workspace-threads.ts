'use client';

import {
  createThread,
  fetchThreads,
  updateThread,
} from '@/apis/message-threads';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

// Import the context directly from the file
import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import { MessageThread } from '../models/message-threads';

export function useWorkspaceThreads() {
  const queryClient = useQueryClient();
  const { activeWorkspace, setActiveThread, activeThread } =
    useSmartSpaceChat();

  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [hoveredThreadId, setHoveredThreadId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const initialThreadSetRef = useRef<Record<string, boolean>>({});

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

  // Handle thread selection
  const handleThreadChange = useCallback(
    (thread: MessageThread) => {
      console.log('Setting active thread:', thread.name, 'ID:', thread.id);

      // Create a stable reference to the thread to prevent issues with object identity
      const stableThread = { ...thread };

      // Set the active thread with the stable reference
      setActiveThread(stableThread);

      // Store the thread ID to check if it's reset
      const threadId = thread.id;

      // Check if the thread is still selected after a delay
      setTimeout(() => {
        console.log(
          'Active thread after timeout:',
          activeThread?.name,
          'ID:',
          activeThread?.id,
          'Expected:',
          threadId
        );

        // If the thread was reset, try to set it again
        if (!activeThread && threadId) {
          console.log('Thread was reset, attempting to restore');
          setActiveThread(stableThread);
        }
      }, 500);
    },
    [setActiveThread]
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
      // Set the first thread as active
      handleThreadChange(threads[0]);
      // Mark this workspace as having its initial thread set
      initialThreadSetRef.current[activeWorkspace.id] = true;
    }
  }, [activeWorkspace?.id, threads, activeThread, handleThreadChange]);

  // useEffect to check if activeThread is being reset
  useEffect(() => {
    console.log(
      'activeThread in useEffect:',
      activeThread?.name,
      'ID:',
      activeThread?.id
    );
  }, [activeThread]);

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
  };
}
