import webApi from '@/domains/auth/axios-setup';
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
  const response = await webApi.get('/workspaces', {
    params: {
      search: searchTerm,
    },
  });
  return WorkspaceListSchema.parse(response.data.data);
}

// Fetches the list of workspaces from the backend API
export async function fetchWorkspace(id: string): Promise<Workspace> {
  const response = await webApi.get(`/workspaces/${id}`);
  return WorkspaceSchema.parse(response.data);
}

// Fetch users who have access to the workspace for @mention
export async function fetchTaggableUsers(
  workspaceId: string
): Promise<MentionUser[]> {
  const res = await webApi.get(`/workspaces/${workspaceId}/users`);
  return MentionUserListSchema.parse(res.data);
}
