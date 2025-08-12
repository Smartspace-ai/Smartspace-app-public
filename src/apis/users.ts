import webApi from '../utils/axios-setup';
import { Workspace } from '../models/workspace';


export const getUsers = async ({
  workspace,
}: {
  workspace: Workspace | null;
}) => {
  return await webApi.get(`workspaces/${workspace?.id}/access`);
};
