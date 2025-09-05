import { MessageValueType } from '@/models/message';
import { z } from 'zod';

// MessageFile schema
export const MessageFileSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  uniqueName: z.string().optional(),
});

// MessageCreateContent schema
export const MessageCreateContentSchema = z.object({
  text: z.string().optional(),
  image: MessageFileSchema.optional(),
});

// Message schema
export const MessageSchema = z.object({
  id: z.string().optional(),
  content: z.string().optional(),
  contentList: z.array(z.object({
    text: z.string().optional(),
    image: MessageFileSchema.optional(),
  })).optional(),
  files: z.array(MessageFileSchema).optional(),
  createdAt: z.union([z.date(), z.string()]),
  createdBy: z.string().optional(),
  hasComments: z.boolean().optional().default(false),
  response: z.any().optional(),
  comments: z.array(z.any()).optional(), 
  createdByUserId: z.string().optional(),
  messageThreadId: z.string().optional(),
  name: z.string().optional(),
  values: z.array(z.object({
    name: z.string(),
    value: z.any(),
    type: z.nativeEnum(MessageValueType),
    channels: z.record(z.number()),
    createdAt: z.union([z.date(), z.string()]),
    createdBy: z.string(),
    createdByUserId: z.string().optional(),
  })).optional(),
  code: z.number().optional(),
  message: z.string().optional(),
  data: z.any().optional(),
  blockId: z.string().optional(),
  optimistic: z.boolean().optional().default(false),
});

// Type exports for TypeScript
export type MessageFile = z.infer<typeof MessageFileSchema>;
export type MessageCreateContent = z.infer<typeof MessageCreateContentSchema>;
export type Message = z.infer<typeof MessageSchema>;
