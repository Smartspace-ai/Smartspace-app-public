// src/domains/workspaces/service.ts
import { getSmartSpaceChatAPI } from '@/platform/api/generated/chat/api';
import {
  getWorkSpacesIdResponse as workspaceResponseSchema,
  getWorkSpacesIdUsersResponse as workspaceUsersResponseSchema,
  getWorkSpacesResponse as workspacesListResponseSchema,
} from '@/platform/api/generated/chat/zod';
import { parseOrThrow } from '@/platform/validation';

import {
  mapMentionUserDtoToModel,
  mapWorkspaceDtoToModel,
  mapWorkspacesDtoToModels,
} from './mapper';
import type { MentionUser, Workspace } from './model';

const chatApi = getSmartSpaceChatAPI();

export async function fetchWorkspaces(search?: string): Promise<Workspace[]> {
  const response = await chatApi.getWorkSpaces({ search });
  const parsed = parseOrThrow(
    workspacesListResponseSchema,
    response.data,
    'GET /workspaces'
  );
  return mapWorkspacesDtoToModels(parsed.data);
}

export async function fetchWorkspace(id: string): Promise<Workspace> {
  const response = await chatApi.getWorkSpacesId(id);
  const parsed = parseOrThrow(
    workspaceResponseSchema,
    response.data,
    `GET /workspaces/${id}`
  );
  return mapWorkspaceDtoToModel(parsed);
}

export async function fetchTaggableUsers(
  workspaceId: string
): Promise<MentionUser[]> {
  const response = await chatApi.getWorkSpacesIdUsers(workspaceId);
  const parsed = parseOrThrow(
    workspaceUsersResponseSchema,
    response.data,
    `GET /workspaces/${workspaceId}/users`
  );
  return parsed.map(mapMentionUserDtoToModel);
}
