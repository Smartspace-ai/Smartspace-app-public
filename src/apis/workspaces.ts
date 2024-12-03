import { Workspace } from '../models/workspace';
import webApi from '../utils/axios-setup';

export const getWorkspaces = async () => {
  const response = await webApi.get('/workspaces');
  const data = response.data.data.map((w: Workspace) => new Workspace(w));
  return data;
};

export const getWorkspaceAccess = async (workspaceId: string) => {
  return await webApi.get(`workspaces/${workspaceId}/access`);
};
