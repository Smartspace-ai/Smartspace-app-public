// src/domain/workspaces/queries.ts
import { useQuery } from '@tanstack/react-query';
import { workspaceKeys } from './queryKeys';
import { fetchTaggableUsers, fetchWorkspace, fetchWorkspaces } from './service';

export const useWorkspaces = (searchTerm?: string) => {
  return useQuery({
    queryKey: workspaceKeys.list(searchTerm),
    queryFn: () => fetchWorkspaces(searchTerm),
  });
};

export const useWorkspace = (workspaceId: string) => {
  return useQuery({
    queryKey: workspaceKeys.byId(workspaceId),
    queryFn: () => fetchWorkspace(workspaceId),
  });
};

export const useTaggableWorkspaceUsers = (workspaceId: string) => {
  return useQuery({
    queryKey: workspaceKeys.taggableUsers(workspaceId),
    queryFn: () => fetchTaggableUsers(workspaceId),
  });
};
