'use client';

import { fetchThreads } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import useSmartSpaceChat from '../contexts/smartspace-context';

export function useWorkspaceThreads() {
  const { activeWorkspace, activeThread, setActiveThread } =
    useSmartSpaceChat();
  const queryClient = useQueryClient();

  // Fetch threads for the active workspace
  const {
    data: threads = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['threads', activeWorkspace?.id],
    queryFn: () => fetchThreads(activeWorkspace?.id),
    enabled: !!activeWorkspace,
  });

  // Set the first thread as active if none is selected
  useEffect(() => {
    if (
      activeWorkspace &&
      (!activeThread || activeThread.workspaceId !== activeWorkspace.id) &&
      threads.length > 0
    ) {
      console.log('Setting initial thread:', threads[0].title);
      setActiveThread(threads[0]);
    }
  }, [threads, activeWorkspace, activeThread, setActiveThread]);

  // Handle thread change
  const handleThreadChange = (thread: (typeof threads)[0]) => {
    console.log('Thread change requested:', thread.title, 'ID:', thread.id);

    // Force state update with the new thread
    setActiveThread(null); // First clear it to force a re-render

    // Use setTimeout to ensure the state update happens in a separate tick
    setTimeout(() => {
      setActiveThread(thread);
      console.log('Active thread set to:', thread.title);

      // Force a refetch of messages for this thread
      queryClient.invalidateQueries({ queryKey: ['messages', thread.id] });
    }, 0);
  };

  // Update thread metadata (replies, lastActivity)
  const updateThreadMetadata = (
    threadId: number,
    updates: { replies?: number; lastActivity?: string }
  ) => {
    queryClient.setQueryData(
      ['threads', activeWorkspace?.id],
      (oldThreads: typeof threads = []) =>
        oldThreads.map((thread) =>
          thread.id === threadId ? { ...thread, ...updates } : thread
        )
    );
  };

  return {
    threads,
    activeThread,
    isLoading,
    error,
    refetch,
    handleThreadChange,
    updateThreadMetadata,
  };
}
