import { fetchWorkspace, fetchWorkspaces } from '@/apis/workspaces';
import { useIsAuthenticated } from '@azure/msal-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Workspace } from '../models/workspace';

export function useWorkspaces(searchTerm?: string) {
  const navigate = useNavigate();
  const { workspaceId, threadId } = useParams();
  const activeWorkspace = useActiveWorkspace();
  const isAuthenticated = useIsAuthenticated();

  const {
    data: workspaces = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspaces', searchTerm],
    queryFn: () => fetchWorkspaces(searchTerm),
    enabled: isAuthenticated
  });

  useEffect(() => {
    if (threadId || workspaces.length === 0 || activeWorkspace) return;

    const matchedWorkspace = workspaces.find((w) => w.id === workspaceId);
    const fallbackWorkspace = workspaces[0];

    const selectedWorkspace = matchedWorkspace || fallbackWorkspace;
    if (!matchedWorkspace) {
      navigate(`/workspace/${selectedWorkspace.id}`);
    }
  }, [workspaces, workspaceId, activeWorkspace, navigate]);

  const handleWorkspaceChange = (workspace: Workspace) => {
    navigate(`/workspace/${workspace.id}`);
  };

  return {
    workspaces,
    isLoading,
    error,
    refetch,
    handleWorkspaceChange,
  };
}

export function useActiveWorkspace() {
  const { workspaceId } = useParams();
  const isAuthenticated = useIsAuthenticated();
  
  const {
    data: activeWorkspace
  } = useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: () => fetchWorkspace(workspaceId || ''),
    enabled: isAuthenticated && !!workspaceId,
  });

  return activeWorkspace;
}
