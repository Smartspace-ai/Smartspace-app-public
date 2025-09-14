import webApi from '@/domains/auth/axios-setup';
import { Comment, CommentList, CommentSchema, commentSchemaList, MentionUser } from "./schemas";

// Fetch all comments for a given thread
export async function fetchComments(
  threadId: string
): Promise<CommentList> {
    const response = await webApi.get(`/messageThreads/${threadId}/comments`);
    const parsed = commentSchemaList.parse(response.data.data);

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
    const response = await webApi.post(`/messageThreads/${threadId}/comments`, {
      content,
      mentionedUsers: mentionedUsers.map((user) => user.id),
    });
    return CommentSchema.parse(response.data);
}



