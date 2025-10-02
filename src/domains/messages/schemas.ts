import { z } from 'zod';

import { MessageResponseSourceType, MessageValueType } from '@/domains/messages/enums';

import { FileInfoSchema } from '../files/schemas';


// MessageResponseSource schema
export const MessageResponseSourceSchema = z.object ({
  index: z.number(),
  uri: z.string(),
  name: z.string().nullish(),
  sourceType: z.nativeEnum(MessageResponseSourceType).nullish(),
});

// MessageResponse schema
export const MessageResponseSchema = z.object({
  content: z.string(),
  messageId: z.string(),
  sources: z.array(MessageResponseSourceSchema).nullish(),
  isReplying: z.boolean().nullish().default(false),
  requestedJsonSchema: z.string().nullish(),
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
  createdAt: z.union([z.date(), z.string()]),
  createdBy: z.string().nullish(),
  hasComments: z.boolean().default(false),
  createdByUserId: z.string().nullish(),
  messageThreadId: z.string().nullish(),
  errors: z.array(MessageErrorMessageSchema).nullish(),
  values: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.nativeEnum(MessageValueType),
    value: z.any(), // Can be string (for Output), array (for Input), or object (for Variables)
    channels: z.record(z.number()),
    createdAt: z.union([z.date(), z.string()]),
    createdBy: z.string(),
    createdByUserId: z.string().nullish(),
  })).nullish(),
  optimistic: z.boolean().optional().default(false)
});

export const MessageItemContentSchema = z.object({
  text: z.string().nullish(),
  image: FileInfoSchema.nullish(),
});

// Type exports for TypeScript
export type Message = z.infer<typeof MessageSchema>;
export const messageSchemaList = z.array(MessageSchema);
export type MessageList = z.infer<typeof messageSchemaList>;
export type MessageContentItem = z.infer<typeof MessageItemContentSchema>;
export type MessageResponseSource = z.infer<typeof MessageResponseSourceSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;