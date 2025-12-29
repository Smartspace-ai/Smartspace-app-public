import { getInitials } from '@/shared/utils/initials';

import { TMentionUserDto, TWorkspaceDto } from './dto';
import { MentionUser, Variables, Workspace } from './model';

const toDate = (x: string | Date | null | undefined): Date | undefined =>
  x == null ? undefined : (x instanceof Date ? x : new Date(x));

const truthy = (b: unknown): boolean => Boolean(b);

const computeAvatar = (name: string, fallback?: string): string => {
  if (fallback && fallback.trim().length > 0) return fallback;
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export function mapMentionUserDtoToModel(dto: TMentionUserDto): MentionUser {
  return {
    id: dto.id,
    displayName: dto.displayName,
    initials: dto.initials ?? getInitials(dto.displayName ?? ''),
  };
}

export function mapVariablesDtoToModel(dto: unknown): Variables {
  if (!dto || typeof dto !== 'object') return {};
  const out: Variables = {};
  for (const [key, val] of Object.entries(dto as Record<string, any>)) {
    if (!val || typeof val !== 'object') continue;
    const schema = (val.schema && typeof val.schema === 'object') ? (val.schema as Record<string, unknown>) : {};
    const access = (val.access === 'Read' || val.access === 'Write') ? val.access : 'Read';
    out[key] = { schema, access };
  }
  return out;
}

export function mapWorkspaceDtoToModel(dto: TWorkspaceDto): Workspace {

  const variables = mapVariablesDtoToModel(dto.variables);

  return {
    id: dto.id,
    name: dto.name,
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
    isPromptAndResponseLoggingEnabled: dto.isPromptAndResponseLoggingEnabled ?? undefined,
    inputs: dto.inputs ?? undefined,

    variables,

    sandBoxThreadId: dto.sandBoxThreadId ?? undefined,
    supportsFiles: dto.supportsFiles ?? undefined,

    avatarName: computeAvatar(dto.name, dto.avatarName ?? undefined),
  };
}

export const mapWorkspacesDtoToModels = (arr: TWorkspaceDto[]) => arr.map(mapWorkspaceDtoToModel);
