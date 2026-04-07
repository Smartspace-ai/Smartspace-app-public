import { ChatApi, ChatZod } from '@smartspace/api-client';
import { Subject } from 'rxjs';

import { api } from '@/platform/api';
import { parseOrThrow } from '@/platform/validation';

import { FileInfo } from '@/domains/files';

import { mapMessageDtoToModel, mapMessagesDtoToModels } from './mapper';
import type { Message, MessageContentItem } from './model';

const { getMessageThreadsIdMessagesResponse: messagesResponseSchema } = ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

/** Backend sends null createdByUserId on system-generated values; Zod schema requires string. */
function coerceMessageDto(raw: Record<string, unknown>): void {
  if (raw.createdByUserId == null) raw.createdByUserId = '';
  if (Array.isArray(raw.values)) {
    for (const v of raw.values as Record<string, unknown>[]) {
      if (v.createdByUserId == null) v.createdByUserId = '';
    }
  }
}

// Fetch all messages in a given message thread
export async function fetchMessages(
  threadId: string,
  opts?: { take?: number; skip?: number }
): Promise<Message[]> {
  const response = await chatApi.getMessageThreadsIdMessages(threadId, opts);
  const parsed = parseOrThrow(
    messagesResponseSchema,
    response.data,
    `GET /messageThreads/${threadId}/messages`
  );
  return mapMessagesDtoToModels(parsed.data);
}

// Send structured input (e.g. form values) to a specific message
export async function addInputToMessage({
  messageId,
  name,
  value,
  channels,
}: {
  messageId: string;
  name: string;
  value: unknown;
  channels: Record<string, number> | null;
}): Promise<Message> {
  let result: Message | null = null;

  await api.post(
    `/messages/${messageId}/values`,
    { name, value, channels },
    {
      adapter: 'xhr',
      headers: { Accept: 'text/event-stream' },
      onDownloadProgress: (event) => {
        const xhr = event.event?.currentTarget as XMLHttpRequest | undefined;
        const raw = String(xhr?.response ?? '');
        // Split by server-sent event message delimiter and normalize "data:" prefix
        const chunks = raw
          .split('\n\n')
          .map((c) => c.trim())
          .filter(Boolean);
        const last = chunks[chunks.length - 1] || '';
        const dataLine = last.startsWith('data:') ? last.slice(5).trim() : last;
        if (!dataLine) return;
        try {
          const parsed = JSON.parse(dataLine);
          coerceMessageDto(parsed);
          const dto = messagesResponseSchema.shape.data.element.parse(parsed);
          result = mapMessageDtoToModel(dto);
        } catch (error) {
          // Ignore incomplete JSON frames; wait for more data
        }
      },
    }
  );

  if (!result) {
    throw new Error('No valid message received from stream');
  }

  return result;
}

// Post a new user message to a thread (supports content + files + variables).
// Returns a Subject synchronously so the caller can subscribe *before* data arrives.
export function postMessage({
  workSpaceId,
  threadId,
  contentList,
  files,
  variables,
}: {
  workSpaceId: string;
  threadId: string;
  contentList?: MessageContentItem[];
  files?: FileInfo[];
  variables?: Record<string, unknown>;
}): Subject<Message> {
  const inputs: Array<{ name: string; value: unknown }> = [];

  if (contentList?.length) {
    inputs.push({
      name: 'prompt',
      value: contentList,
    });
  }

  if (files?.length) {
    inputs.push({
      name: 'files',
      value: files.map((file) => ({
        id: file.id,
        name: file.name,
        _type: 'File',
      })),
    });
  }

  const payload = {
    inputs,
    messageThreadId: threadId,
    workspaceId: workSpaceId,
    variables,
  };

  const observable = new Subject<Message>();

  api
    .post(`/messages`, payload, {
      adapter: 'xhr',
      headers: { Accept: 'text/event-stream' },
      onDownloadProgress: (e) => {
        const xhr = e.event?.currentTarget as XMLHttpRequest | undefined;
        const raw = String(xhr?.response ?? '');
        // eslint-disable-next-line no-console
        console.log(
          '[SSE] onDownloadProgress fired, raw length:',
          raw.length,
          'xhr exists:',
          !!xhr
        );
        const chunks = raw
          .split('\n\n')
          .map((c) => c.trim())
          .filter(Boolean);
        if (!chunks.length) return;
        const last = chunks[chunks.length - 1];
        const dataLine = last.startsWith('data:') ? last.slice(5).trim() : last;
        if (!dataLine) return;
        try {
          const parsed = JSON.parse(dataLine);
          coerceMessageDto(parsed);
          const dto = messagesResponseSchema.shape.data.element.parse(parsed);
          const parsedMessage = mapMessageDtoToModel(dto);
          // eslint-disable-next-line no-console
          console.log(
            '[SSE] emitting message:',
            parsedMessage.id,
            'values:',
            parsedMessage.values?.map((v) => v.name)
          );
          observable.next(parsedMessage);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[SSE] parse failed:', err);
        }
      },
    })
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('[SSE] stream complete');
      observable.complete();
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[SSE] stream error:', error);
      observable.error(error);
    });

  return observable;
}
