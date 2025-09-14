import { z } from 'zod';

export const MentionUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  initials: z.string().nullish(),
});

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
