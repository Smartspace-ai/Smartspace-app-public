import webApi from '@/domains/auth/axios-setup';
import { Workspace } from '../models/workspace';

// Fetches the list of workspaces from the backend API
export async function fetchWorkspaces(searchTerm?: string): Promise<Workspace[]> {
  const response = await webApi.get('/workspaces', {
    params: {
      search: searchTerm
    }
  });

  // Map raw API response to Workspace model instances
  const data = response.data.data.map((w: Workspace) => new Workspace(w));

  return data;
}


// Fetches the list of workspaces from the backend API
export async function fetchWorkspace(id: string): Promise<Workspace> {
  const response = await webApi.get(`/workspaces/${id}`);

  // Map raw API response to Workspace model instances
  const data = new Workspace(response.data);

  return data;
}
