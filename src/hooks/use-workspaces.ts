import { fetchWorkspaces } from '@/apis/workspaces';
import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workspace } from '../models/workspace';

export function useWorkspaces() {
  const { activeWorkspace, setActiveWorkspace, setActiveThread } =
    useSmartSpaceChat();
  const navigate = useNavigate();

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
      setActiveWorkspace(workspaces[0]);
      //navigate(`/${workspaces[0].id}`, { replace: true });
    }
  }, [workspaces, activeWorkspace, setActiveWorkspace, navigate]);

  // Handle workspace change
  const handleWorkspaceChange = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    setActiveThread(null); // Clear active thread when changing workspace
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
