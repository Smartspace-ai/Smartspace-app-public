import { MessageComment } from '@/models/message-comment';
import { api } from '@/platform/api/apiClient';
import { MentionUser } from './../models/mention-user';

// Fetch all comments for a given thread
export async function fetchComments(
  threadId: string
): Promise<MessageComment[]> {
  try {
    const response = await api.get(`/messageThreads/${threadId}/comments`);

    if (!response.data.data) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    // Sort comments in ascending order (oldest first)
    const sortedComments = response.data.data.sort(
      (a: MessageComment, b: MessageComment) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Map raw objects to MessageComment model
    return sortedComments.map(
      (comment: MessageComment) => new MessageComment(comment)
    );
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw new Error('Error fetching comments');
  }
}

// Add a comment to a thread
export async function addComment(
  threadId: string,
  content: string,
  mentionedUsers: MentionUser[] = []
): Promise<MessageComment> {
  try {
    // Simulate latency (can be removed in production)
    await new Promise((resolve) => setTimeout(resolve, 400));

    const response = await api.post(`/messageThreads/${threadId}/comments`, {
      content,
      mentionedUsers: mentionedUsers.map((user) => user.id),
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


// Fetch users who have access to the workspace for @mention
export async function fetchTaggableUsers(workspaceId: string): Promise<MentionUser[]> {
  try {
    const res = await api.get(`/workspaces/${workspaceId}/users`);
    return res.data.map(
      (u: any) =>
        new MentionUser({
          id: u.id,
          displayName: u.displayName,
        })
    );
  } catch (error) {
    console.error('Error fetching taggable users:', error);
    return [];
  }
}