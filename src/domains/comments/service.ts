import { ChatApi, ChatZod } from '@smartspace/api-client';
import type { z } from 'zod';

import { mapCommentDtoToModel, mapCommentsDtoToModels } from './mapper';
import { Comment, MentionUser } from './model';

const {
  messageThreadsGetCommentsResponse: commentsResponseSchema,
  messageThreadsPostCommentResponse: commentCreateResponseSchema,
} = ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

// Fetch all comments for a given thread
export async function fetchComments(threadId: string): Promise<Comment[]> {
  const response = await chatApi.messageThreadsGetComments(threadId);
  // The API now returns mentionedUsers as {userId, name}[] objects rather than string[],
  // so the generated schema rejects it. Cast and let the mapper normalise the shape.
  const raw = response.data as unknown as z.infer<
    typeof commentsResponseSchema
  >;
  const models = mapCommentsDtoToModels(raw.data);
  return models.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

// Add a comment to a thread
export async function addComment(
  threadId: string,
  content: string,
  mentionedUsers: MentionUser[] = []
): Promise<Comment> {
  const response = await chatApi.messageThreadsPostComment(threadId, {
    content,
    mentionedUsers: mentionedUsers.map((u) => u.id),
  });
  // The API now returns mentionedUsers as {userId, name}[] objects rather than string[],
  // so the generated schema rejects it. Cast and let the mapper normalise the shape.
  const raw = response.data as unknown as z.infer<
    typeof commentCreateResponseSchema
  >;
  const model = mapCommentDtoToModel({ ...raw, messageThreadId: threadId });
  return model;
}
