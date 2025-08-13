import {  getWorkspace } from '@/apis/workspaces';
import { useIsAuthenticated } from '@azure/msal-react';
import { useQuery } from '@tanstack/react-query';


export const  useQueryWorkspace = (workspaceId: string | undefined)=> {
  const isAuthenticated = useIsAuthenticated();

  const queryWorkspace = useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: () => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      return getWorkspace(workspaceId);
    },
    enabled: isAuthenticated && !!workspaceId,
  });
  return { queryWorkspace };
}
