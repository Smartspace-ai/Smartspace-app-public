import { api } from '@/platform/api/apiClient';
import { safeParse } from '@/shared/utils/safeParse';
import { Comment, CommentList, CommentSchema, commentSchemaList, MentionUser } from "./schemas";

// Fetch all comments for a given thread
export async function fetchComments(
  threadId: string
): Promise<CommentList> {
    const response = await api.get(`/messageThreads/${threadId}/comments`);
    const parsed = safeParse(commentSchemaList, response.data.data, 'fetchComments');
    // Sort comments in ascending order (oldest first)
    const sortedComments = parsed.sort(
      (a: Comment, b: Comment) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return sortedComments;
}

// Add a comment to a thread
export async function addComment(
  threadId: string,
  content: string,
  mentionedUsers: MentionUser[] = []
): Promise<Comment> {
    const response = await api.post(`/messageThreads/${threadId}/comments`, {
      content,
      mentionedUsers: mentionedUsers.map((user) => user.id),
    });
    return safeParse(CommentSchema, {
      ...response.data,
      messageThreadId: threadId,
    }, 'addComment');
}



