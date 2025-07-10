import { Message, MessageCreateContent, MessageFile } from '@/models/message';
import webApi from '@/utils/axios-setup';

// Fetch all messages in a given message thread
export async function fetchMessages(threadId: string): Promise<Message[]> {
  try {
    const response = await webApi.get(`messagethreads/${threadId}/messages`);
    const messages = (response.data.data as Message[]) || [];
    return messages.map((message) => new Message(message));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages');
  }
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
  value: any;
  channels: Record<string, number> | null;
}): Promise<Message> {
  return new Promise((resolve, reject) => {
    let lastMessage: Message | null = null;

    webApi
      .post(
        `/messages/${messageId}/values`,
        { name, value, channels },
        {
          headers: { Accept: 'text/event-stream' },
          responseType: 'stream', // Note: this isn't a native axios option, could be a custom adapter
          onDownloadProgress: (event) => {
            const raw = event.event.currentTarget.response as string;
            const chunks = raw.split('\n\ndata:');

            try {
              const lastChunk = chunks[chunks.length - 1];
              if (lastChunk.trim()) {
                const parsed = JSON.parse(lastChunk);
                lastMessage = new Message(parsed);
              }
            } catch (error) {
              console.warn('Stream parse error:', error);
            }
          },
        }
      )
      .then(() => {
        if (lastMessage) {
          resolve(lastMessage);
        } else {
          reject(new Error('No valid message received from stream'));
        }
      })
      .catch((error) => {
        console.error('Streaming error:', error);
        reject(error);
      });
  });
}

// Post a new user message to a thread (supports content + files)
export async function postMessage({
  workSpaceId,
  threadId,
  contentList,
  files,
}: {
  workSpaceId: string;
  threadId: string;
  contentList?: MessageCreateContent[];
  files?: MessageFile[];
}): Promise<Message> {
  try {
    const inputs: any[] = [];

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
    };

    const response = await webApi.post(
      `/messages`,
      payload
    );

    return new Message(response.data);
  } catch (error) {
    console.error('Error posting message:', error);
    throw new Error('Failed to post message');
  }
}
