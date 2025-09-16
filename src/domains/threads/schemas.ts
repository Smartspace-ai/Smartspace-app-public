import { z } from 'zod';

export const MessageThreadSchema = z.object({
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

export const ThreadsResponseSchema = z.object({
  data: z.array(MessageThreadSchema),
  total: z.number().int().nonnegative(),
});

export type ThreadsResponse = z.infer<typeof ThreadsResponseSchema>;
export type MessageThread = z.infer<typeof MessageThreadSchema>;
