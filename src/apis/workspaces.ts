import { Workspace } from '../models/workspace';
import webApi from '../utils/axios-setup';

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const response = await webApi.get('/workspaces');
  const data = response.data.data.map((w: any) => new Workspace(w));
  return data;
}
