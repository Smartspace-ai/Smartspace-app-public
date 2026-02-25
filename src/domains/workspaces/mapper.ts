import type { z } from 'zod';

import {
  getWorkSpacesIdResponse as workspaceResponseSchema,
  getWorkSpacesIdUsersResponse as workspaceUsersResponseSchema,
  getWorkSpacesResponse as workspacesListResponseSchema,
} from '@/platform/api/generated/chat/zod';

import { getInitials } from '@/shared/utils/initials';

import { MentionUser, Variables, Workspace } from './model';

type WorkspaceDto = z.infer<typeof workspaceResponseSchema>;
type WorkspacesListResponseDto = z.infer<typeof workspacesListResponseSchema>;
type WorkspacesListItemDto = WorkspacesListResponseDto['data'][number];
type MentionUserDto = z.infer<typeof workspaceUsersResponseSchema>[number];

const toDate = (x: string | Date | null | undefined): Date | undefined =>
  x == null ? undefined : x instanceof Date ? x : new Date(x);

const truthy = (b: unknown): boolean => Boolean(b);

const toAccess = (raw: unknown): 'Read' | 'Write' => {
  if (raw === 'Write' || raw === 1) return 'Write';
  return 'Read';
};

const computeAvatar = (name: string, fallback?: string): string => {
  if (fallback && fallback.trim().length > 0) return fallback;
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export function mapMentionUserDtoToModel(dto: MentionUserDto): MentionUser {
  return {
    id: dto.id,
    displayName: dto.displayName ?? '',
    initials: getInitials(dto.displayName ?? ''),
  };
}

export function mapVariablesDtoToModel(dto: unknown): Variables {
  if (!dto || typeof dto !== 'object') return {};
  const out: Variables = {};
  for (const [key, val] of Object.entries(dto as Record<string, unknown>)) {
    if (!val || typeof val !== 'object') continue;
    const v = val as Record<string, unknown>;
    const schemaRaw = v['schema'];
    const schema =
      schemaRaw && typeof schemaRaw === 'object'
        ? (schemaRaw as Record<string, unknown>)
        : {};

    const accessRaw = v['access'];
    out[key] = { schema, access: toAccess(accessRaw) };
  }
  return out;
}

export function mapWorkspaceDtoToModel(dto: WorkspaceDto): Workspace {
  const variables = mapVariablesDtoToModel(dto.variables);

  return {
    id: dto.id ?? '',
    name: dto.name ?? '',
    tags: dto.tags ?? [],
    showSources: dto.showSources ?? undefined,
    dataSpaces: Array.isArray(dto.dataSpaces) ? dto.dataSpaces : undefined,

    createdByUserId: dto.createdByUserId ?? undefined,
    createdAt: toDate(dto.createdAt),

    modifiedByUserId: dto.modifiedByUserId ?? undefined,
    modifiedAt: toDate(dto.modifiedAt),

    favorited: truthy(dto.favorited),

    summary: dto.summary ?? undefined,
    firstPrompt: dto.firstPrompt ?? undefined,

    outputSchema: dto.outputSchema ?? undefined,
    isPromptAndResponseLoggingEnabled:
      dto.isPromptAndResponseLoggingEnabled ?? undefined,
    inputs: dto.inputs ?? undefined,

    variables,

    sandBoxThreadId: dto.sandBoxThreadId ?? undefined,
    supportsFiles: dto.supportsFiles ?? undefined,

    avatarName: computeAvatar(dto.name ?? ''),
  };
}

export const mapWorkspacesDtoToModels = (arr: WorkspacesListItemDto[]) =>
  arr.map(mapWorkspaceDtoToModel);
