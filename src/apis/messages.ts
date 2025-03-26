import { Message } from '../models/message';
import webApi from '../utils/axios-setup';

/**
 * Fetches messages for a specific thread
 */
export async function fetchMessages(threadId: string): Promise<Message[]> {
  try {
    const response = await webApi.get(`messagethreads/${threadId}/messages`);
    const messages = (response.data.data as Message[]) || [];
    // Map the API response to Message objects
    return messages.map((message: Message) => new Message(message));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages');
  }
}

/**
 * Adds a user message to a thread
 */
export async function addMessage(
  threadId: string,
  content: string
): Promise<Message> {
  const response = await fetch(`/messageThreads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add any authentication headers here
    },
    body: JSON.stringify({
      content,
      // Add any other required fields here
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add message: ${response.statusText}`);
  }

  const data = await response.json();

  // Map the API response to a Message object
  return new Message(data);
}

/**
 * Sends a message and returns the user message
 */
export async function sendMessage(
  threadId: string,
  content: string
): Promise<Message> {
  try {
    // First add the user message
    const userMessage = await addMessage(threadId, content);

    // Return the user message immediately
    return userMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Error sending message');
  }
}

/**
 * Adds a bot response to a thread
 */
export async function addBotResponse(
  threadId: string,
  threadTitle: string
): Promise<Message> {
  const response = await fetch(`/messageThreads/${threadId}/botResponse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      threadTitle,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get bot response: ${response.statusText}`);
  }

  const data = await response.json();

  // Map the API response to a Message object
  return new Message(data);
}

/**
 * Gets a bot response for a message
 */
export async function getBotResponse(
  threadId: string,
  threadTitle: string
): Promise<Message> {
  try {
    return await addBotResponse(threadId, threadTitle);
  } catch (error) {
    console.error('Error getting bot response:', error);
    throw new Error('Error getting bot response:');
  }
}
