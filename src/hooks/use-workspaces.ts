import { fetchWorkspace, fetchWorkspaces } from '@/apis/workspaces';
import { useIsAuthenticated } from '@azure/msal-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Workspace } from '../models/workspace';

export function useWorkspaces() {
  const navigate = useNavigate();
  const { workspaceId, threadId } = useParams();
  const isAuthenticated = useIsAuthenticated();

  const {
    data: workspaces = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
    enabled: isAuthenticated
  });
  
  const {
    data: activeWorkspace
  } = useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: () => fetchWorkspace(workspaceId || ''),
    enabled: isAuthenticated && !!workspaceId,
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
    activeWorkspace,
    isLoading,
    error,
    refetch,
    handleWorkspaceChange,
  };
}
