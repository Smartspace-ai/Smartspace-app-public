import { ChatZod } from '@smartspace-ai/api-client';
import type { z } from 'zod';

import { utcDate } from '@/shared/utils/dateFromApi';

import { MessageValueType } from './enums';
import { Message } from './model';

const { getMessageThreadsIdMessagesResponse: messagesResponseSchema } = ChatZod;

type MessagesResponseDto = z.infer<typeof messagesResponseSchema>;
type MessageDto = MessagesResponseDto['data'][number];

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
    createdAt: utcDate(dto.createdAt),
    createdBy: dto.createdBy ?? undefined,
    hasComments: dto.hasComments ?? false,
    createdByUserId: dto.createdByUserId ?? undefined,
    messageThreadId: dto.messageThreadId ?? undefined,
    errors:
      dto.errors?.map((e) => ({
        ...e,
        data: e.data as string | null | undefined,
      })) ?? undefined,
    values: dto.values
      ? dto.values.map((v) => ({
          id: v.id,
          name: v.name,
          type: v.type as unknown as MessageValueType,
          value: v.value,
          channels: normalizeChannels(v.channels ?? {}),
          createdAt: utcDate(v.createdAt),
          createdBy: v.createdBy ?? '',
          createdByUserId: v.createdByUserId ?? undefined,
        }))
      : undefined,
  };
}

export function mapMessagesDtoToModels(dto: MessageDto[]): Message[] {
  return dto.map(mapMessageDtoToModel);
}
