import { z } from 'zod';

// ---- Mentionable users ------------------------------------------------------
export const MentionUserDto = z.object({
  id: z.string(),
  displayName: z.string(),
  initials: z.string().nullable().optional(), // backend may omit or send null
});
export type TMentionUserDto = z.infer<typeof MentionUserDto>;
export const MentionUserListDto = z.array(MentionUserDto);

// ---- Variables --------------------------------------------------------------
export const VariableAccessDto = z.enum(['Read', 'Write']);
export const VariablesDto = z
  .record(
    z.object({
      schema: z.record(z.any()),
      access: VariableAccessDto,
    }),
  )
  .optional(); // backend may omit → mapper will default to {}

// ---- Model configuration (keep minimal; do NOT import other domains) -------
export const ModelConfigurationInlineDto = z.object({
  id: z.string().optional().nullable(),
  modelId: z.string().optional().nullable(),
  prePrompt: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  modelDisplayText: z.string().optional().nullable(),
  // model: z.unknown().optional().nullable(), // if backend includes full model, keep unknown to avoid cross-domain deps
});

// ---- Workspace --------------------------------------------------------------
export const WorkspaceDto = z.object({
  id: z.string(),
  name: z.string(),
  tags: z.array(z.string()).optional().nullable(),
  showSources: z.boolean().optional().nullable(),

  dataSpaces: z.array(z.any()).optional().nullable(),

  createdByUserId: z.string().optional().nullable(),
  createdAt: z.union([z.string(), z.date()]).optional().nullable(),

  modifiedByUserId: z.string().optional().nullable(),
  modifiedAt: z.union([z.string(), z.date()]).optional().nullable(),

  favorited: z.boolean().optional().nullable(),

  modelConfigurations: z.array(ModelConfigurationInlineDto).optional().nullable(),

  summary: z.string().optional().nullable(),
  firstPrompt: z.string().optional().nullable(),

  outputSchema: z.unknown().optional().nullable(),
  isPromptAndResponseLoggingEnabled: z.boolean().optional().nullable(),
  inputs: z.unknown().optional().nullable(),

  variables: VariablesDto, // optional in DTO; mapper will default to {}

  sandBoxThreadId: z.string().optional().nullable(),
  supportsFiles: z.boolean().optional().nullable(),

  avatarName: z.string().optional().nullable(),
});

export type TWorkspaceDto = z.infer<typeof WorkspaceDto>;

// Common API envelopes you referenced
export const WorkspacesListResponseDto = z.object({
  data: z.array(WorkspaceDto),
//   total: z.number().int().nonnegative().optional(), // add if your API returns it
});

export type TWorkspacesListResponseDto = z.infer<typeof WorkspacesListResponseDto>;
