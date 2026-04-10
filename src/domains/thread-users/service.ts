import { ChatApi, ChatZod } from '@smartspace/api-client';

import { parseOrThrow } from '@/platform/validation';

import { mapThreadUserDtoToModel } from './mapper';
import type { ThreadUser } from './model';

const { getMessageThreadsThreadIdUsersResponse: threadUsersResponseSchema } =
  ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

export async function fetchThreadUsers(
  threadId: string
): Promise<ThreadUser[]> {
  const response = await chatApi.getMessageThreadsThreadIdUsers(threadId);
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
  await chatApi.postMessageThreadsThreadIdUsersUserId(threadId, userId);
}

export async function removeThreadUser(
  threadId: string,
  userId: string
): Promise<void> {
  await chatApi.deleteMessageThreadsThreadIdUsersUserId(threadId, userId);
}
