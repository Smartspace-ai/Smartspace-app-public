import { Message, MessageCreateContent, MessageFile } from '@/models/message';
import webApi from '@/utils/axios-setup';

/**
 * Fetches messages for a specific thread.
 */
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

/**
 * Posts a user message to a thread (supporting contentList/files).
 */
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
        value: files,
      });
    }

    const payload = {
      inputs,
      messageThreadId: threadId,
      workspaceId: workSpaceId,
    };

    const response = await webApi.post(
      `/messages/${workSpaceId}/${threadId}`,
      payload
    );
    const message = response.data;
    return new Message(message);
  } catch (error) {
    console.error('Error posting message:', error);
    throw new Error('Failed to post message');
  }
}

/**
 * Updates a specific message with a new input value.
 */
export async function addInputToMessage({
  messageId,
  name,
  value,
  channels,
}: {
  messageId: string;
  name: string;
  value: any;
  channels?: Record<string, number> | null;
}): Promise<Message> {
  try {
    const response = await webApi.post(`/messages/${messageId}/values`, {
      name,
      value,
      channels,
    });

    return new Message(response.data);
  } catch (error) {
    console.error('Error updating message input:', error);
    throw new Error('Failed to update message input');
  }
}

/**
 * Adds a bot response to a thread.
 */
export async function addBotResponse(
  threadId: string,
  threadTitle: string
): Promise<Message> {
  try {
    const response = await webApi.post(
      `/messageThreads/${threadId}/botResponse`,
      {
        threadTitle,
      }
    );

    return new Message(response.data);
  } catch (error) {
    console.error('Error getting bot response:', error);
    throw new Error('Failed to get bot response');
  }
}
