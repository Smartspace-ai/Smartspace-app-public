import './setup';

import { ChatModels, ChatZod } from '@smartspace/api-client';
import { fake } from 'zod-schema-faker/v4';

export const makeWorkspace = (
  overrides: Partial<ChatModels.WorkSpacesWorkSpace> = {}
): ChatModels.WorkSpacesWorkSpace => ({
  ...fake(ChatZod.workSpacesGetIdResponse),
  ...overrides,
});

export const makeWorkspacesResponse = (
  workspaces: ChatModels.WorkSpacesWorkSpace[] = [makeWorkspace()]
): { data: ChatModels.WorkSpacesWorkSpace[]; total: number } => ({
  data: workspaces,
  total: workspaces.length,
});
