import webApi from '../utils/axios-setup';

export const getWorkspaceAccess = async (workspaceId: string) => {
  return await webApi.get(`workspaces/${workspaceId}/access`);
};
