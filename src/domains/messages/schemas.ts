import { MessageValueType } from '@/domains/messages/types';
import { z } from 'zod';

// MessageFile schema
export const MessageFileSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  uniqueName: z.string().nullish(),
});

export const MessageErrorMessageSchema = z.object({
  code: z.number(),
  message: z.string().nullish(),
  data: z.string().nullish(),
  blockId: z.string().nullish(),
});

// Message schema
export const MessageSchema = z.object({
  id: z.string().nullish(),
  content: z.string().nullish(),
  contentList: z.array(z.object({
    text: z.string().nullish(),
    image: MessageFileSchema.nullish(),
  })).nullish(),
  files: z.array(MessageFileSchema).nullish(),
  createdAt: z.union([z.date(), z.string()]),
  createdBy: z.string().nullish(),
  hasComments: z.boolean().nullish().default(false),
  response: z.any().nullish(),
  comments: z.array(z.any()).nullish(), 
  createdByUserId: z.string().nullish(),
  messageThreadId: z.string().nullish(),
  name: z.string().nullish(),
  errors: z.array(MessageErrorMessageSchema).nullish(),
  values: z.array(z.object({
    id: z.string(),
    name: z.string(),
    value: z.union([z.string(), z.array(z.any()), z.record(z.any())]), // Can be string (for Output), array (for Input), or object (for Variables)
    type: z.nativeEnum(MessageValueType),
    channels: z.record(z.number()),
    createdAt: z.union([z.date(), z.string()]),
    createdBy: z.string(),
    createdByUserId: z.string().nullish(),
  })).nullish(),
  optimistic: z.boolean().nullish().default(false),
});


export const MessageContentSchema = z.object({
  text: z.string().nullish(),
  image: MessageFileSchema.nullish(),
});


// Type exports for TypeScript
export type MessageFile = z.infer<typeof MessageFileSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type MessageContent = z.infer<typeof MessageContentSchema>;
