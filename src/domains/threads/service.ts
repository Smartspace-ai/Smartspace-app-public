import { z } from 'zod';

import { apiParsed } from '@/platform/apiParsed';

import { MessageThreadDto, ThreadsResponseDto } from './dto';
import { mapThreadDtoToModel, mapThreadsResponseDtoToModel } from './mapper';
import { MessageThread } from './model';

// Fetch threads for a given workspace
export async function fetchThreads(
  workspaceId?: string,
  { take, skip }: { take?: number; skip?: number } = {}
) {
  const data = await apiParsed.get(ThreadsResponseDto, `workspaces/${workspaceId}/messagethreads`, { params: { take, skip } });
  return mapThreadsResponseDtoToModel(data);
}

export async function fetchThread(
  workspaceId: string,  
  id: string
): Promise<MessageThread> {
  const data = await apiParsed.get(MessageThreadDto, `workspaces/${workspaceId}/messagethreads/${id}`);
  return mapThreadDtoToModel(data);
}

// Set favorite status of a message thread
export async function setFavorite(
  threadId: string,
  favourite: boolean
): Promise<void> {
  await apiParsed.put(z.any(),
    `/messagethreads/${threadId}/favorited`,
    favourite,
    { headers: { 'Content-Type': 'application/json' } }
  );
  // API returns a primitive (e.g., string). We don't need the body.
  return;
}

// Rename a message thread
export async function renameThread(
  threadId: string,
  name: string
): Promise<MessageThread> {
  const data = await apiParsed.put(MessageThreadDto, `/messagethreads/${threadId}/name`, name, { headers: { 'Content-Type': 'application/json' } });
  return mapThreadDtoToModel(data);
}

// Delete a message thread by ID
export async function deleteThread(threadId: string) {
  return await apiParsed.del(z.any(), `/messagethreads/${threadId}`);
}

// Create a new message thread
export async function createThread(
  name: string,
  workspaceId: string
){
  // Keep endpoint casing consistent with fetchThread/fetchThreads
  const data = await apiParsed.post(
    MessageThreadDto,
    `workspaces/${workspaceId}/messagethreads`,
    { name }
  );
  return mapThreadDtoToModel(data);
}
