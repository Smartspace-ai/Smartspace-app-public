import { api } from '@/platform/api/apiClient';

import { safeParse } from '@/shared/utils/safeParse';

import {
    MentionUser,
    MentionUserListSchema,
    Workspace,
    WorkspaceListSchema,
    WorkspaceSchema
} from './schemas';

// Fetches the list of workspaces from the backend API
export async function fetchWorkspaces(
  searchTerm?: string
): Promise<Workspace[]> {
  const response = await api.get('/workspaces', {
    params: {
      search: searchTerm,
    },
  });
  return safeParse(WorkspaceListSchema, response.data.data, 'fetchWorkspaces');
}

// Fetches the list of workspaces from the backend API
export async function fetchWorkspace(id: string): Promise<Workspace> {
  const response = await api.get(`/workspaces/${id}`);
  return safeParse(WorkspaceSchema, response.data, 'fetchWorkspace');
}

// Fetch users who have access to the workspace for @mention
export async function fetchTaggableUsers(
  workspaceId: string
): Promise<MentionUser[]> {
  const res = await api.get(`/workspaces/${workspaceId}/users`);
  return safeParse(MentionUserListSchema, res.data, 'fetchTaggableUsers');
}
