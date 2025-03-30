import { MessageComment } from '@/models/message-comment';
import webApi from '../utils/axios-setup';

/**
 * Fetches comments for a thread
 */
export async function fetchComments(
  threadId: string
): Promise<MessageComment[]> {
  try {
    const response = await webApi.get(`/messageThreads/${threadId}/comments`);

    if (!response.data.data) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    // Map the API response to MessageComment objects
    return response.data.data.map(
      (comment: MessageComment) => new MessageComment(comment)
    );
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw new Error('Error fetching comments:');
  }
}

/**
 * Adds a comment to a thread
 */
export async function addComment(
  threadId: string,
  content: string
): Promise<MessageComment> {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    const response = await webApi.post(`/messageThreads/${threadId}/comments`, {
      content,
      // Add any other required fields here
    });

    if (!response.data.data) {
      throw new Error(`Failed to add comment: ${response.statusText}`);
    }

    // Map the API response to a MessageComment object
    return new MessageComment({
      id: response.data.data.id,
      content: response.data.data.content,
      createdAt: response.data.data.createdAt,
      createdBy: response.data.data.createdBy,
      createdByUserId: response.data.data.createdByUserId,
      mentionedUsers: response.data.data.mentionedUsers || [],
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    throw new Error('Failed to add comment');
  }
}
