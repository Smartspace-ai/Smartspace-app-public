import { getSmartSpaceChatAPI } from '@/platform/api/generated/chat/api';
import {
  getWorkSpacesIdMessageThreadsResponse as threadsListResponseSchema,
  getWorkspacesWorkspaceIdMessagethreadsIdResponse as threadResponseSchema,
  postWorkspacesWorkspaceIdMessagethreadsResponse as createThreadResponseSchema,
} from '@/platform/api/generated/chat/zod';

import { mapThreadDtoToModel, mapThreadsResponseDtoToModel } from './mapper';

const chatApi = getSmartSpaceChatAPI();

// Fetch threads for a given workspace
export async function fetchThreads(
  workspaceId: string,
  { take, skip }: { take?: number; skip?: number } = {}
) {
  const response = await chatApi.getWorkSpacesIdMessageThreads(workspaceId, {
    take,
    skip,
  });
  const parsed = threadsListResponseSchema.parse(response.data);
  return mapThreadsResponseDtoToModel(parsed);
}

export async function fetchThread(workspaceId: string, id: string) {
  const response = await chatApi.getWorkspacesWorkspaceIdMessagethreadsId(
    workspaceId,
    id
  );
  const parsed = threadResponseSchema.parse(response.data);
  return mapThreadDtoToModel(parsed);
}

// Set favorite status of a message thread
export async function setFavorite(
  threadId: string,
  favorite: boolean
): Promise<void> {
  await chatApi.putMessageThreadsIdFavorited(threadId, favorite);
  return;
}

// Rename a message thread
export async function renameThread(
  threadId: string,
  name: string
): Promise<void> {
  await chatApi.putMessageThreadsIdName(threadId, name);
  return;
}

// Delete a message thread by ID
export async function deleteThread(threadId: string): Promise<void> {
  await chatApi.deleteMessageThreadsId(threadId);
  return;
}

// Create a new message thread
export async function createThread(name: string, workspaceId: string) {
  const response = await chatApi.postWorkspacesWorkspaceIdMessagethreads(
    workspaceId,
    { name }
  );
  const parsed = createThreadResponseSchema.parse(response.data);
  const first = parsed.data?.[0];
  if (!first) {
    throw new Error('Create thread response did not include a thread');
  }
  return mapThreadDtoToModel(first);
}
