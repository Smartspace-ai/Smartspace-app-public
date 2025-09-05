import webApi from '@/domains/auth/axios-setup';
import { Subject } from 'rxjs';
import { Message, MessageContent, MessageFile, MessageSchema } from './schemas';

// Fetch all messages in a given message thread
export async function fetchMessages(threadId: string): Promise<Message[]> {
  const response = await webApi.get(`messagethreads/${threadId}/messages`);
  const messages = response.data?.data || [];
  return messages.map((message: unknown) => MessageSchema.parse(message));
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

  await webApi.post(
    `/messages/${messageId}/values`,
    { name, value, channels },
    {
      headers: { Accept: 'text/event-stream' },
      responseType: 'stream',
      onDownloadProgress: (event) => {
        const data = event.event.currentTarget.response as string;
        const chunks = data.split('\n\ndata:');
        const lastChunk = chunks[chunks.length - 1];

        if (lastChunk.trim()) {
          try {
            const parsed = JSON.parse(lastChunk);
            result = MessageSchema.parse(parsed);
          } catch (error) {
            console.warn('Stream parse error:', error);
          }
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
  contentList?: MessageContent[];
  files?: MessageFile[];
  variables?: Record<string, unknown>;
}): Promise<Subject<Message>> {
  const inputs = [];

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
    await webApi.post(
      `/messages`,
      payload,
      {
        headers: { Accept: 'text/event-stream' },
        responseType: 'stream',
        onDownloadProgress: (e) => {
          const data = e.event.currentTarget.response as string;
          const messages = data.split('\n\ndata:');
          if (messages.length) {
            const message = JSON.parse(messages[messages.length - 1]);
            const parsedMessage = MessageSchema.parse(message);
            observable.next(parsedMessage);
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
