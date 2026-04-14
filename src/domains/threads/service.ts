import { ChatApi, ChatZod } from '@smartspace/api-client';

import { parseOrThrow } from '@/platform/validation';

import { mapThreadDtoToModel, mapThreadsResponseDtoToModel } from './mapper';

const {
  getWorkSpacesIdMessageThreadsResponse: threadsListResponseSchema,
  getWorkspacesWorkspaceIdMessagethreadsIdResponse: threadResponseSchema,
  postWorkspacesWorkspaceIdMessagethreadsResponse: createThreadResponseSchema,
} = ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

// Fetch threads for a given workspace
export async function fetchThreads(
  workspaceId: string,
  { take, skip }: { take?: number; skip?: number } = {}
) {
  const response = await chatApi.getWorkSpacesIdMessageThreads(workspaceId, {
    take,
    skip,
  });
  const parsed = parseOrThrow(
    threadsListResponseSchema,
    response.data,
    `GET /workspaces/${workspaceId}/messagethreads`
  );
  return mapThreadsResponseDtoToModel(parsed);
}

export async function fetchThread(workspaceId: string, id: string) {
  const response = await chatApi.getWorkspacesWorkspaceIdMessagethreadsId(
    workspaceId,
    id
  );
  const parsed = parseOrThrow(
    threadResponseSchema,
    response.data,
    `GET /workspaces/${workspaceId}/messagethreads/${id}`
  );
  return mapThreadDtoToModel(parsed);
}

// Set pin status of a message thread
export async function setPin(threadId: string, pin: boolean): Promise<void> {
  await chatApi.putMessageThreadsIdFavorited(threadId, pin);
}

// Rename a message thread
export async function renameThread(
  threadId: string,
  name: string
): Promise<void> {
  // API expects a JSON string body; axios won't JSON-encode plain strings.
  await chatApi.putMessageThreadsIdName(threadId, JSON.stringify(name));
}

// Delete a message thread by ID
export async function deleteThread(threadId: string): Promise<void> {
  await chatApi.deleteMessageThreadsId(threadId);
}

// Create a new message thread
export async function createThread(name: string, workspaceId: string) {
  const response = await chatApi.postWorkspacesWorkspaceIdMessagethreads(
    workspaceId,
    { name }
  );
  const parsed = parseOrThrow(
    createThreadResponseSchema,
    response.data,
    `POST /workspaces/${workspaceId}/messagethreads`
  );
  const first = parsed.data?.[0];
  if (!first) {
    throw new Error('Create thread response did not include a thread');
  }
  return mapThreadDtoToModel(first);
}
