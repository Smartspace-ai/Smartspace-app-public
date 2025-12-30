import { z } from 'zod';

export const MentionUserSchema = z.preprocess((input) => {
  if (!input || typeof input !== 'object') return input;
  const obj = input as Record<string, unknown>;
  const getString = (o: Record<string, unknown>, key: string): string | undefined => {
    const value = o[key];
    return typeof value === 'string' ? value : undefined;
  };
  const id = getString(obj, 'id') ?? getString(obj, 'userId') ?? getString(obj, 'Id');
  const displayName =
    getString(obj, 'displayName') ??
    getString(obj, 'name') ??
    getString(obj, 'fullName') ??
    getString(obj, 'DisplayName') ??
    getString(obj, 'UserDisplayName') ??
    getString(obj, 'Name');
  const initials = getString(obj, 'initials') ?? getString(obj, 'Initials');
  return { id, displayName, initials };
}, z.object({
  id: z.string(),
  displayName: z.string().default(''),
  initials: z.string().nullish(),
}));

export const CommentSchema = z.object({
  id: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  createdByUserId: z.string(),
  createdBy: z.string(),
  content: z.string(),
  mentionedUsers: z.array(MentionUserSchema).default([]),
  messageThreadId: z.string(),
});

export type MentionUser = z.infer<typeof MentionUserSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export const commentSchemaList = z.array(CommentSchema);
export type CommentList = z.infer<typeof commentSchemaList>;
