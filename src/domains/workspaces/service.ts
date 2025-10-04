// src/domains/workspaces/service.ts
import { apiParsed } from '@/platform/apiParsed';

import { MentionUserListDto, WorkspaceDto, WorkspacesListResponseDto } from './dto';
import { mapMentionUserDtoToModel, mapWorkspaceDtoToModel, mapWorkspacesDtoToModels } from './mapper';
import type { MentionUser, Workspace } from './model';

export async function fetchWorkspaces(search?: string): Promise<Workspace[]> {
  const dto = await apiParsed.get(WorkspacesListResponseDto, '/workspaces', { params: { search } });
  return mapWorkspacesDtoToModels(dto.data);
}

export async function fetchWorkspace(id: string): Promise<Workspace> {
  const dto = await apiParsed.get(WorkspaceDto, `/workspaces/${id}`);
  return mapWorkspaceDtoToModel(dto);
}

export async function fetchTaggableUsers(workspaceId: string): Promise<MentionUser[]> {
  const list = await apiParsed.get(MentionUserListDto, `/workspaces/${workspaceId}/users`);
  return list.map(mapMentionUserDtoToModel);
}
