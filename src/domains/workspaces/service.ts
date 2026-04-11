// src/domains/workspaces/service.ts
import { ChatApi, ChatZod } from '@smartspace/api-client';

import { parseOrThrow } from '@/platform/validation';

import {
  mapMentionUserDtoToModel,
  mapWorkspaceDtoToModel,
  mapWorkspacesDtoToModels,
} from './mapper';
import type { MentionUser, Workspace } from './model';

const {
  workSpacesGetIdResponse: workspaceResponseSchema,
  workSpacesGetUsersResponse: workspaceUsersResponseSchema,
  workSpacesGetGetResponse: workspacesListResponseSchema,
} = ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

export async function fetchWorkspaces(search?: string): Promise<Workspace[]> {
  const response = await chatApi.workSpacesGetGet({ search });
  const parsed = parseOrThrow(
    workspacesListResponseSchema,
    response.data,
    'GET /workspaces'
  );
  return mapWorkspacesDtoToModels(parsed.data);
}

export async function fetchWorkspace(id: string): Promise<Workspace> {
  const response = await chatApi.workSpacesGetId(id);
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
  const response = await chatApi.workSpacesGetUsers(workspaceId);
  const parsed = parseOrThrow(
    workspaceUsersResponseSchema,
    response.data,
    `GET /workspaces/${workspaceId}/users`
  );
  return parsed.map(mapMentionUserDtoToModel);
}
