import { z } from 'zod';

import { MessageResponseSourceType, MessageValueType } from './enums';

export const FileInfoDto = z.object({ id: z.string(), name: z.string() });

export const MessageItemContentDto = z.object({
  text: z.string().nullish(),
  image: FileInfoDto.nullish(),
});
export type TMessageItemContentDto = z.infer<typeof MessageItemContentDto>;

export const MessageValueDto = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(MessageValueType),
  value: z.any(),
  channels: z.record(z.number()),
  createdAt: z.union([z.date(), z.string()]),
  createdBy: z.string(),
  createdByUserId: z.string().nullish(),
});

export const MessageDto = z.object({
  id: z.string().nullish(),
  createdAt: z.union([z.date(), z.string()]),
  createdBy: z.string().nullish(),
  hasComments: z.boolean().optional().default(false),
  createdByUserId: z.string().nullish(),
  messageThreadId: z.string().nullish(),
  errors: z.array(
    z.object({ code: z.number(), message: z.string().nullish(), data: z.string().nullish(), blockId: z.string().nullish() })
  ).nullish(),
  values: z.array(MessageValueDto).nullish(),
});
export type TMessageDto = z.infer<typeof MessageDto>;
export const MessageListDto = z.array(MessageDto);
export type TMessageListDto = z.infer<typeof MessageListDto>;

export const MessagesEnvelopeDto = z.object({ data: z.array(MessageDto) });
export type TMessagesEnvelopeDto = z.infer<typeof MessagesEnvelopeDto>;

export const MessageResponseSourceDto = z.object({
  index: z.number(),
  datasetItemId: z.string().optional(),
  containerItemId: z.string().nullish(),
  flowRunId: z.string().optional(),
  file: FileInfoDto.optional(),
  sourceType: z.nativeEnum(MessageResponseSourceType),
});






