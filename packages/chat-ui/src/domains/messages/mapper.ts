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
// The generated api-client schema doesn't carry the machine-readable error
// category yet — callers re-attach it from the raw payload (either spelling)
// before mapping, so the field survives api-client regeneration lag.
type MessageErrorDto = NonNullable<MessageDto['errors']>[number] & {
  errorCode?: string | null;
  error_code?: string | null;
};

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

// The API publishes `type` as an extensible enum, so the SDK's zod lets any
// string through. Input and Output decide where a value sits on the page, and
// `MessageValueType` is the set this UI can place.
const placeableTypes = new Set<string>(Object.values(MessageValueType));
const warnedTypes = new Set<string>();

/**
 * Maps one value as the API sent it. Does not apply the unknown-type rule, so
 * existing callers keep their contract; map a list through
 * `mapMessageValuesDtoToModels` to get it.
 */
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

/**
 * Maps the values the UI can place and drops the rest, warning once per
 * unknown type. An API value this build has never seen hides that value; it
 * never breaks the message.
 */
export function mapMessageValuesDtoToModels(
  dtos: MessageValueDto[]
): MessageValue[] {
  const kept: MessageValue[] = [];
  for (const dto of dtos) {
    if (!placeableTypes.has(dto.type)) {
      if (!warnedTypes.has(dto.type)) {
        warnedTypes.add(dto.type);
        console.warn(
          '[messages] dropped value with unknown type:',
          dto.type,
          dto.id
        );
      }
      continue;
    }
    kept.push(mapMessageValueDtoToModel(dto));
  }
  return kept;
}

export function mapMessageErrorDtoToModel(dto: MessageErrorDto): MessageError {
  const { error_code, ...rest } = dto;
  return {
    ...rest,
    errorCode: dto.errorCode ?? error_code ?? undefined,
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
    values: dto.values && mapMessageValuesDtoToModels(dto.values),
  };
}

export function mapMessagesDtoToModels(dto: MessageDto[]): Message[] {
  return dto.map(mapMessageDtoToModel);
}

/**
 * Merge a streaming delta into a message. `outputs` is a cumulative snapshot
 * keyed by value `id` — when an output streams from "He" → "Hel" → "Hello" we
 * receive three deltas each carrying the full text-so-far under one id, so we
 * replace by id rather than appending. Several blocks can be wired into a
 * single flow output (five render blocks feeding one "Files" output, say);
 * those arrive under the same NAME but different ids and must all survive,
 * which is why the key is not `(name, type)`. Errors aren't documented as
 * cumulative, so we append them.
 */
export function applyDeltaToMessage(
  target: Message,
  delta: { outputs: MessageValue[]; errors: MessageError[] }
): Message {
  if (!delta.outputs.length && !delta.errors.length) return target;
  const nextValues = (target.values ?? []).slice();
  for (const incoming of delta.outputs) {
    const idx = nextValues.findIndex((v) =>
      // Values with no id come from a server that predates per-output ids;
      // fall back to the old key so their chunks still replace in place.
      incoming.id
        ? v.id === incoming.id
        : v.name === incoming.name && v.type === incoming.type
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
