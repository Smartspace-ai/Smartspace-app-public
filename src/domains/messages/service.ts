import { Subject } from 'rxjs';

import { api } from '@/platform/api';
import { apiParsed } from '@/platform/apiParsed';

import { FileInfo } from '@/domains/files';

import { MessageDto, MessagesEnvelopeDto } from './dto';
import { mapMessageDtoToModel, mapMessagesDtoToModels } from './mapper';
import type { Message, MessageContentItem } from './model';


// Fetch all messages in a given message thread
export async function fetchMessages(
  threadId: string,
  opts?: { take?: number; skip?: number }
): Promise<Message[]> {
  const envelope = await apiParsed.get(
    MessagesEnvelopeDto,
    `messagethreads/${threadId}/messages`,
    { params: opts }
  );
  return mapMessagesDtoToModels(envelope.data);
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
      headers: { Accept: 'text/event-stream' },
      responseType: 'stream',
      onDownloadProgress: (event) => {
        const raw = String(event.event.currentTarget.response || '');
        // Split by server-sent event message delimiter and normalize "data:" prefix
        const chunks = raw.split('\n\n').map((c) => c.trim()).filter(Boolean);
        const last = chunks[chunks.length - 1] || '';
        const dataLine = last.startsWith('data:') ? last.slice(5).trim() : last;
        if (!dataLine) return;
        try {
          const parsed = JSON.parse(dataLine);
          const dto = MessageDto.parse(parsed);
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

// Post a new user message to a thread (supports content + files + variables)
export async function postMessage({
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
}): Promise<Subject<Message>> {
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

  try {
    await api.post(
      `/messages`,
      payload,
      {
        headers: { Accept: 'text/event-stream' },
        responseType: 'stream',
        onDownloadProgress: (e) => {
          const raw = String(e.event.currentTarget.response || '');
          const chunks = raw.split('\n\n').map((c) => c.trim()).filter(Boolean);
          if (!chunks.length) return;
          const last = chunks[chunks.length - 1];
          const dataLine = last.startsWith('data:') ? last.slice(5).trim() : last;
          if (!dataLine) return;
          try {
            const parsed = JSON.parse(dataLine);
            const dto = MessageDto.parse(parsed);
            const parsedMessage = mapMessageDtoToModel(dto);
            observable.next(parsedMessage);
          } catch {
            // likely partial frame, ignore
          }
        },
      },
    );
    observable.complete();
  } catch (error) {
    observable.error(error);
  }

  return observable;
}
