import { z } from 'zod';

// ---- Mention user (DTO) ------------------------------------------------------
export const MentionUserDto = z.object({
  id: z.string(),
  displayName: z.string().default(''),
  initials: z.string().nullish(),
});
export type TMentionUserDto = z.infer<typeof MentionUserDto>;

// ---- Comment (DTO) -----------------------------------------------------------
export const CommentDto = z.object({
  id: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  createdByUserId: z.string(),
  createdBy: z.string(),
  content: z.string(),
  mentionedUsers: z.array(MentionUserDto).default([]),
  messageThreadId: z.string(),
});
export type TCommentDto = z.infer<typeof CommentDto>;

// ---- Envelopes ---------------------------------------------------------------
export const CommentsListResponseDto = z.object({
  data: z.array(CommentDto),
});
export type TCommentsListResponseDto = z.infer<typeof CommentsListResponseDto>;






