import { ChatApi, ChatZod } from '@smartspace-ai/api-client';

import { parseOrThrow } from '@/platform/validation';

import { mapCommentDtoToModel, mapCommentsDtoToModels } from './mapper';
import { Comment, MentionUser } from './model';

const {
  getMessageThreadsIdCommentsResponse: commentsResponseSchema,
  postMessageThreadsIdCommentsResponse: commentCreateResponseSchema,
} = ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

// Fetch all comments for a given thread
export async function fetchComments(threadId: string): Promise<Comment[]> {
  const response = await chatApi.getMessageThreadsIdComments(threadId);
  const parsed = parseOrThrow(
    commentsResponseSchema,
    response.data,
    `GET /messageThreads/${threadId}/comments`
  );
  const models = mapCommentsDtoToModels(parsed.data);
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
  const response = await chatApi.postMessageThreadsIdComments(threadId, {
    content,
    mentionedUsers: mentionedUsers.map((u) => u.id),
  });
  const parsed = parseOrThrow(
    commentCreateResponseSchema,
    response.data,
    `POST /messageThreads/${threadId}/comments`
  );
  const model = mapCommentDtoToModel({ ...parsed, messageThreadId: threadId });
  return model;
}
