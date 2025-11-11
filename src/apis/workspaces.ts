import { api } from '@/platform/api/apiClient';
import { Workspace } from '../models/workspace';
import { DEFAULT_WORKSPACES_ORDER } from '@/theme/public-config';

// Fetches the list of workspaces from the backend API
export async function fetchWorkspaces(searchTerm?: string): Promise<Workspace[]> {
  const response = await api.get('/workspaces', {
    params: {
      search: searchTerm,
      orderBy: DEFAULT_WORKSPACES_ORDER

    }
  });

  // Map raw API response to Workspace model instances
  const data = response.data.data.map((w: Workspace) => new Workspace(w));

  return data;
}


// Fetches the list of workspaces from the backend API
export async function fetchWorkspace(id: string): Promise<Workspace> {
  const response = await api.get(`/workspaces/${id}`);

  // Map raw API response to Workspace model instances
  const data = new Workspace(response.data);

  return data;
}
