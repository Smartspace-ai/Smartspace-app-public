import { Workspace } from '../models/workspace';
import webApi from '../utils/axios-setup';

// Fetches the list of workspaces from the backend API
export async function fetchWorkspaces(): Promise<Workspace[]> {
  const response = await webApi.get('/workspaces');

  // Map raw API response to Workspace model instances
  const data = response.data.data.map((w: Workspace) => new Workspace(w));

  return data;
}
