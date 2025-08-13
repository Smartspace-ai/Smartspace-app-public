import webApi from '../utils/axios-setup';
import { Workspace } from '../models/workspace';


export const getWorkspaces = async (searchTerm?: string) => {
  const response = await webApi.get('/workspaces', { params: { searchTerm } });
  const data = response.data.data.map((w: any) => new Workspace(w));
  return data;
};

export const getWorkspaceAccess = async (workspaceId: string) => {
  return await webApi.get(`workspaces/${workspaceId}/access`);
};


// Fetches the list of workspaces from the backend API
export  const getWorkspace = async (id: string): Promise<Workspace> => {
  const response = await webApi.get(`/workspaces/${id}`);
  return new Workspace(response.data);
}