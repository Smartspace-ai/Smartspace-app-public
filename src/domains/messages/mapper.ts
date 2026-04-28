import { ChatZod } from '@smartspace/api-client';
import type { z } from 'zod';

import { utcDate } from '@/shared/utils/dateFromApi';

import { MessageValueType } from './enums';
import { Message, MessageValue } from './model';

const {
  messageThreadsThreadMessagesIdMessagesResponse: messagesResponseSchema,
} = ChatZod;

type MessagesResponseDto = z.infer<typeof messagesResponseSchema>;
type MessageDto = MessagesResponseDto['data'][number];
type MessageValueDto = NonNullable<MessageDto['values']>[number];
type MessageErrorDto = NonNullable<MessageDto['errors']>[number];

export type MessageError = NonNullable<Message['errors']>[number];

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

export function mapMessageValueDtoToModel(dto: MessageValueDto): MessageValue {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type as unknown as MessageValueType,
    value: dto.value,
    channels: normalizeChannels(dto.channels ?? {}),
    createdAt: utcDate(dto.createdAt),
    createdBy: dto.createdBy ?? '',
    createdByUserId: dto.createdByUserId ?? undefined,
  };
}

export function mapMessageErrorDtoToModel(dto: MessageErrorDto): MessageError {
  return {
    ...dto,
    data: dto.data as string | null | undefined,
  };
}

export function mapMessageDtoToModel(dto: MessageDto): Message {
  return {
    id: dto.id ?? undefined,
    createdAt: utcDate(dto.createdAt),
    createdBy: dto.createdBy ?? undefined,
    hasComments: dto.hasComments ?? false,
    createdByUserId: dto.createdByUserId ?? undefined,
    messageThreadId: dto.messageThreadId ?? undefined,
    errors: dto.errors?.map(mapMessageErrorDtoToModel) ?? undefined,
    values: dto.values?.map(mapMessageValueDtoToModel),
  };
}

export function mapMessagesDtoToModels(dto: MessageDto[]): Message[] {
  return dto.map(mapMessageDtoToModel);
}

/**
 * Merge a streaming delta into a message. `outputs` is a cumulative snapshot
 * keyed by `(name, type)` per the SSE protocol — when an output streams from
 * "He" → "Hel" → "Hello" we receive three deltas each carrying the full
 * text-so-far, so we replace by key rather than appending. Errors aren't
 * documented as cumulative, so we append them.
 */
export function applyDeltaToMessage(
  target: Message,
  delta: { outputs: MessageValue[]; errors: MessageError[] }
): Message {
  if (!delta.outputs.length && !delta.errors.length) return target;
  const nextValues = (target.values ?? []).slice();
  for (const incoming of delta.outputs) {
    const idx = nextValues.findIndex(
      (v) => v.name === incoming.name && v.type === incoming.type
    );
    if (idx === -1) nextValues.push(incoming);
    else nextValues[idx] = incoming;
  }
  return {
    ...target,
    values: nextValues,
    errors: delta.errors.length
      ? [...(target.errors ?? []), ...delta.errors]
      : target.errors,
  };
}
