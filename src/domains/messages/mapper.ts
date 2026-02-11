import type { z } from 'zod';

import { getMessageThreadsIdMessagesResponse as messagesResponseSchema } from '@/platform/api/generated/chat/zod';

import { parseIsoDate } from '@/shared/utils/parseIsoDate';

import { MessageValueType } from './enums';
import { Message } from './model';

type MessagesResponseDto = z.infer<typeof messagesResponseSchema>;
type MessageDto = MessagesResponseDto['data'][number];
type MessageValueDto = MessageDto['values'][number];

const toChannelNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const normalizeChannels = (
  channels: Record<string, unknown>
): Record<string, number> =>
  Object.fromEntries(
    Object.entries(channels).map(([key, val]) => [key, toChannelNumber(val)])
  );

export function mapMessageDtoToModel(dto: MessageDto): Message {
  return {
    id: dto.id ?? undefined,
    createdAt: parseIsoDate(dto.createdAt, 'createdAt'),
    createdBy: dto.createdBy ?? undefined,
    hasComments: dto.hasComments ?? false,
    createdByUserId: dto.createdByUserId ?? undefined,
    messageThreadId: dto.messageThreadId ?? undefined,
    errors: dto.errors ?? undefined,
    values: dto.values
      ? dto.values.map((v) => ({
          id: v.id,
          name: v.name,
          type: v.type as MessageValueType,
          value: v.value,
          channels: normalizeChannels(v.channels ?? {}),
          createdAt: parseIsoDate(v.createdAt, 'values.createdAt'),
          createdBy: v.createdBy ?? '',
          createdByUserId: v.createdByUserId ?? undefined,
        }))
      : undefined,
  };
}

export function mapMessagesDtoToModels(dto: MessageDto[]): Message[] {
  return dto.map(mapMessageDtoToModel);
}
