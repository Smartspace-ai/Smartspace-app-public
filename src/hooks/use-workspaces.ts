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

  // Fetch workspace list via React Query
  const {
    data: workspaces = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
  });

  // Set the first available workspace as active on initial load
  useEffect(() => {
    if (!activeWorkspace && workspaces.length > 0) {
      setActiveWorkspace(workspaces[0]);
      navigate(`/workspace/${workspaces[0].id}`, { replace: true });
    }
  }, [workspaces, activeWorkspace, setActiveWorkspace, navigate]);

  // Change active workspace and reset active thread
  const handleWorkspaceChange = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    setActiveThread(null);
    navigate(`/workspace/${workspace.id}`, { replace: true });
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
