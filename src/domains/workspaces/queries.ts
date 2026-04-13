import { queryOptions, useQuery } from '@tanstack/react-query';

import { useChatService } from '@/platform/chat';
import type { ChatService } from '@/platform/chat';

import type { MentionUser, Workspace } from './model';
import { workspaceKeys } from './queryKeys';
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

export const workspaceDetailOptions = ({
  service,
  workspaceId,
}: {
  service: ChatService;
  workspaceId: string;
}) =>
  queryOptions<Workspace>({
    queryKey: workspaceKeys.byId(workspaceId),
    queryFn: () => service.fetchWorkspace(workspaceId),
    staleTime: 30_000,
  });

export function useWorkspace(workspaceId: string) {
  const service = useChatService();
  return useQuery(workspaceDetailOptions({ service, workspaceId }));
}

export const taggableUsersOptions = ({
  service,
  workspaceId,
}: {
  service: ChatService;
  workspaceId: string;
}) =>
  queryOptions<MentionUser[]>({
    queryKey: workspaceKeys.taggableUsers(workspaceId),
    queryFn: () => service.fetchTaggableUsers(workspaceId),
    staleTime: 30_000,
  });

export function useTaggableWorkspaceUsers(workspaceId: string) {
  const service = useChatService();
  return useQuery(taggableUsersOptions({ service, workspaceId }));
}
