// App-side workspaces queries — sidebar list only. Chat-relevant queries
// (useWorkspace, workspaceDetailOptions, useTaggableWorkspaceUsers,
// taggableUsersOptions) live in @smartspace/chat-ui.
import { queryOptions, useQuery } from '@tanstack/react-query';

import { workspaceKeys } from '@smartspace/chat-ui';

import { fetchWorkspaces } from './service';

export const workspacesListOptions = (searchTerm?: string) =>
  queryOptions({
    queryKey: workspaceKeys.list(searchTerm),
    queryFn: () => fetchWorkspaces(searchTerm),
    staleTime: 30_000,
  });

export function useWorkspaces(searchTerm?: string) {
  return useQuery(workspacesListOptions(searchTerm));
}
