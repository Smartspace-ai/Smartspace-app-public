'use client';

import { fetchWorkspaces } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSmartSpaceChat } from '../contexts/smartspace-context';

export function useWorkspaces() {
  const { activeWorkspace, setActiveWorkspace } = useSmartSpaceChat();

  // Fetch all workspaces
  const {
    data: workspaces = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
  });

  // Set the first workspace as active if none is selected
  useEffect(() => {
    if (!activeWorkspace && workspaces.length > 0) {
      console.log('Setting initial workspace:', workspaces[0].name);
      setActiveWorkspace(workspaces[0]);
    }
  }, [workspaces, activeWorkspace, setActiveWorkspace]);

  // Handle workspace change
  const handleWorkspaceChange = (workspace: (typeof workspaces)[0]) => {
    console.log('Changing workspace to:', workspace.name);
    setActiveWorkspace(workspace);
  };

  return {
    workspaces,
    activeWorkspace,
    isLoading,
    error,
    refetch,
    handleWorkspaceChange,
  };
}
