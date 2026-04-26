import { queryOptions, useQuery } from '@tanstack/react-query';

import { threadUsersKeys } from './queryKeys';
import { fetchThreadUsers, fetchWorkspaceUsers } from './service';

export const threadUsersOptions = (threadId: string) =>
  queryOptions({
    queryKey: threadUsersKeys.list(threadId),
    queryFn: () => fetchThreadUsers(threadId),
    enabled: !!threadId,
    staleTime: 30_000,
  });

export function useThreadUsers(threadId: string) {
  return useQuery({
    ...threadUsersOptions(threadId),
    enabled: !!threadId,
  });
}

export const workspaceUsersOptions = (workspaceId: string) =>
  queryOptions({
    queryKey: threadUsersKeys.workspaceUsers(workspaceId),
    queryFn: () => fetchWorkspaceUsers(workspaceId),
    enabled: !!workspaceId,
    staleTime: 0,
  });

export function useWorkspaceUsers(workspaceId: string) {
  return useQuery({
    ...workspaceUsersOptions(workspaceId),
    enabled: !!workspaceId,
  });
}
