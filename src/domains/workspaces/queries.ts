import { queryOptions, useQuery } from '@tanstack/react-query';

import type { MentionUser, Workspace } from './model';
import { workspaceKeys } from './queryKeys';
import { fetchTaggableUsers, fetchWorkspace, fetchWorkspaces } from './service';

export const workspacesListOptions = (searchTerm?: string) =>
  queryOptions({
    queryKey: workspaceKeys.list(searchTerm),
    queryFn: () => fetchWorkspaces(searchTerm),
    staleTime: 30_000,
  });

export function useWorkspaces(searchTerm?: string) {
  return useQuery(workspacesListOptions(searchTerm));
}

export const workspaceDetailOptions = (workspaceId: string) =>
  queryOptions<Workspace>({
    queryKey: workspaceKeys.byId(workspaceId),
    queryFn: () => fetchWorkspace(workspaceId),
    staleTime: 30_000,
  });

export function useWorkspace(workspaceId: string) {
  return useQuery(workspaceDetailOptions(workspaceId));
}

export const taggableUsersOptions = (workspaceId: string) =>
  queryOptions<MentionUser[]>({
    queryKey: workspaceKeys.taggableUsers(workspaceId),
    queryFn: () => fetchTaggableUsers(workspaceId),
    staleTime: 30_000,
  });

export function useTaggableWorkspaceUsers(workspaceId: string) {
  return useQuery(taggableUsersOptions(workspaceId));
}
