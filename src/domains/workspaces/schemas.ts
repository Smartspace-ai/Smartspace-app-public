import { z } from 'zod';
import { getInitials } from '../../shared/utils/initials';
import { parseDateTime } from '../../shared/utils/parse-date-time';
import { ModelSchema } from '../models/schemas';

export const MentionUserSchema = z
  .object({
    id: z.string(),
    displayName: z.string(),
    initials: z.string().nullish(),
  })
  .transform((data) => ({
    ...data,
    initials: data.initials ?? getInitials(data.displayName ?? ''),
  }));


const DateLikeToDisplayString = z
  .union([z.string(), z.date()])
  .optional()
  .transform((value) => {
    if (value == null) return undefined;
    return parseDateTime(value, 'DD MMM YYYY');
  });

const VariablesSchema = z
  .record(
    z.object({
      schema: z.record(z.any()),
      access: z.enum(['Read', 'Write']),
    }),
  )
  .default({});

const ModelConfigurationInlineSchema = z.object({
  id: z.string().optional(),
  model: ModelSchema.optional(),
  modelId: z.string().optional(),
  prePrompt: z.string().optional(),
  role: z.string().optional(),
  modelDisplayText: z.string().optional(),
});

export const WorkspaceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    dataSpaces: z.array(z.any()).optional(),
    createdAt: DateLikeToDisplayString,
    createdByUserId: z.string().optional(),
    modifiedAt: DateLikeToDisplayString,
    modifiedByUserId: z.string().optional(),
    prePrompt: z.unknown().optional(),
    summary: z.string().optional(),
    modelConfigurations: z.array(ModelConfigurationInlineSchema).optional(),
    firstPrompt: z.string().optional(),
    avatarName: z.string().optional(),
    supportsFiles: z.boolean().optional(),
    variables: VariablesSchema,
  })
  .transform((workspace) => {
    if (!workspace.avatarName && workspace.name) {
      const splitName = workspace.name.split(' ');
      const computedAvatar =
        splitName.length === 1
          ? splitName[0][0]
          : `${splitName[0][0]}${splitName[splitName.length - 1][0]}`;
      return { ...workspace, avatarName: computedAvatar };
    }
    return workspace;
  });

export type Workspace = z.infer<typeof WorkspaceSchema>;
export const WorkspaceListSchema = z.array(WorkspaceSchema)
export type WorkspaceList = z.infer<typeof WorkspaceListSchema>


export type MentionUser = z.infer<typeof MentionUserSchema>;
export const MentionUserListSchema = z.array(MentionUserSchema)
export type MentionUserList = z.infer<typeof MentionUserListSchema>