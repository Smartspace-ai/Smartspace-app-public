import { ChatApi, ChatZod } from '@smartspace/api-client';

import { parseOrThrow } from '@/platform/validation';

import { mapThreadUserDtoToModel } from './mapper';
import type { ThreadUser } from './model';

const { messageThreadsGetThreadUsersResponse: threadUsersResponseSchema } =
  ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

export async function fetchThreadUsers(
  threadId: string
): Promise<ThreadUser[]> {
  const response = await chatApi.messageThreadsGetThreadUsers(threadId);
  const parsed = parseOrThrow(
    threadUsersResponseSchema,
    response.data,
    `GET /messagethreads/${threadId}/users`
  );
  return parsed.map(mapThreadUserDtoToModel);
}

export async function addThreadUser(
  threadId: string,
  userId: string
): Promise<void> {
  await chatApi.messageThreadsAddThreadUser(threadId, userId);
}
