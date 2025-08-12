import webApi from '../utils/axios-setup';
import { Workspace } from '../models/workspace';


export const getWorkspaces = async () => {
  const response = await webApi.get('/workspaces');
  const data = response.data.data.map((w: any) => new Workspace(w));
  return data;
};

export const getWorkspaceAccess = async (workspaceId: string) => {
  return await webApi.get(`workspaces/${workspaceId}/access`);
};
