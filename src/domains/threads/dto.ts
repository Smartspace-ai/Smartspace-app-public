import { z } from 'zod';

export const MessageThreadDto = z.object({
  id: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  createdBy: z.string(),
  createdByUserId: z.string(),
  isFlowRunning: z.boolean(),
  lastUpdated: z.string(),
  lastUpdatedAt: z.union([z.date(), z.string()]),
  lastUpdatedByUserId: z.string(),
  name: z.string(),
  totalMessages: z.number(),
  favorited: z.boolean().nullish(),
  avatarName: z.string().nullish(),
  workSpaceId: z.string().nullish(),
});

export const ThreadsResponseDto = z.object({
  data: z.array(MessageThreadDto),
  total: z.number().int().nonnegative(),
});

export type TMessageThreadDto = z.infer<typeof MessageThreadDto>;
export type TThreadsResponseDto = z.infer<typeof ThreadsResponseDto>;







