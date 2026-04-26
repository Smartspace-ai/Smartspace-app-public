import { ChatApi, ChatZod } from '@smartspace/api-client';

import { parseOrThrow } from '@/platform/validation';

import type { ThreadUser } from './model';

const {
  messageThreadsGetThreadUsersResponse: threadUsersResponseSchema,
  workSpacesGetUsersResponse: workspaceUsersResponseSchema,
} = ChatZod;

const chatApi = ChatApi.getSmartSpaceChatAPI();

export async function fetchThreadUsers(
  threadId: string
): Promise<ThreadUser[]> {
  const response = await chatApi.messageThreadsGetThreadUsers(threadId);
  const parsed = parseOrThrow(
    threadUsersResponseSchema,
    response.data,
    `GET /messageThreads/${threadId}/users`
  );
  return parsed;
}

export async function addThreadUser(
  threadId: string,
  userId: string
): Promise<void> {
  await chatApi.messageThreadsAddThreadUser(threadId, userId);
}

export async function removeThreadUser(
  threadId: string,
  userId: string
): Promise<void> {
  await chatApi.messageThreadsRemoveThreadUser(threadId, userId);
}

export async function fetchWorkspaceUsers(
  workspaceId: string
): Promise<ThreadUser[]> {
  const response = await chatApi.workSpacesGetUsers(workspaceId);
  const parsed = parseOrThrow(
    workspaceUsersResponseSchema,
    response.data,
    `GET /workspaces/${workspaceId}/users`
  );
  return parsed;
}
