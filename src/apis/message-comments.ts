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

    // Sort comments by createdAt ascending (oldest first)
    const sortedComments = response.data.data.sort(
      (a: MessageComment, b: MessageComment) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Map the API response to MessageComment objects
    return sortedComments.map(
      (comment: MessageComment) => new MessageComment(comment)
    );
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw new Error('Error fetching comments');
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
      mentionedUsers: [],
    });

    const responseData = response?.data;

    if (!responseData?.id) {
      throw new Error('Invalid response from server while adding comment.');
    }

    return new MessageComment({
      id: responseData.id,
      content: responseData.content,
      createdAt: responseData.createdAt,
      createdBy: responseData.createdBy,
      createdByUserId: responseData.createdByUserId,
      mentionedUsers: responseData.mentionedUsers || [],
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    throw new Error('Failed to add comment');
  }
}
