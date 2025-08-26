import { fetchWorkspace, fetchWorkspaces } from '@/apis/workspaces';
import { useTeams } from '@/contexts/teams-context';
import { useIsAuthenticated } from '@azure/msal-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMatch, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { Workspace } from '../models/workspace';

export function useWorkspaces(searchTerm?: string) {
  const navigate = useNavigate();
  const workspaceMatch = useMatch({ from: '/_protected/workspace/$workspaceId', shouldThrow: false });
  const threadMatch = useMatch({ from: '/_protected/workspace/$workspaceId/thread/$threadId', shouldThrow: false });
  const workspaceId = workspaceMatch?.params?.workspaceId;
  const threadId = threadMatch?.params?.threadId;
  const { data: activeWorkspace } = useActiveWorkspace();
  const isAuthenticated = useIsAuthenticated();
  const { isInTeams, isTeamsInitialized } = useTeams();
  const canQuery = isAuthenticated || (isInTeams && isTeamsInitialized);
  const queryClient = useQueryClient();

  const {
    data: workspaces = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspaces', searchTerm],
    queryFn: () => fetchWorkspaces(searchTerm),
    enabled: canQuery,
  });

  useEffect(() => {
    if (threadId || workspaces.length === 0 || activeWorkspace) return;

    const matchedWorkspace = workspaces.find((w) => w.id === workspaceId);
    const fallbackWorkspace = workspaces[0];
    const selectedWorkspace = matchedWorkspace || fallbackWorkspace;
    if (!selectedWorkspace) return;
    
    queryClient.setQueryData(['workspaces', selectedWorkspace.id], selectedWorkspace);
    // Do not navigate here; initial selection is handled by route
  }, [workspaces, workspaceId, activeWorkspace, threadId, navigate, queryClient]);

  const handleWorkspaceChange = (workspace: Workspace) => {
    navigate({
      to: '/workspace/$workspaceId',
      params: {
        workspaceId: workspace.id
      }
    });
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
  const workspaceMatch = useMatch({ from: '/_protected/workspace/$workspaceId', shouldThrow: false });
  const workspaceId = workspaceMatch?.params?.workspaceId;
  const isAuthenticated = useIsAuthenticated();
  const { isInTeams, isTeamsInitialized } = useTeams();
  const canQuery = isAuthenticated || (isInTeams && isTeamsInitialized);

  return useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: () => fetchWorkspace(workspaceId || ''),
    enabled: canQuery && !!workspaceId,
  });
}
