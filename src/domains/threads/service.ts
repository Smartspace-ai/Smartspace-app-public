import { api } from '@/platform/api/apiClient';
import { safeParse } from '@/shared/utils/safeParse';
import { MessageThread, MessageThreadSchema, ThreadsResponseSchema } from './schemas';

// Fetch threads for a given workspace
export async function fetchThreads(
  workspaceId?: string,
  { take, skip }: { take?: number; skip?: number } = {}
) {
  const response = await api.get(
    `workspaces/${workspaceId}/messagethreads`,
    { params: { take, skip } }
  );
  return safeParse(ThreadsResponseSchema, response.data, 'fetchThreads');
}

export async function fetchThread(
  workspaceId: string,  
  id: string
): Promise<MessageThread> {
  const response = await api.get(
    `workspaces/${workspaceId}/messagethreads/${id}`
  );
  return safeParse(MessageThreadSchema, response.data, 'fetchThread');
}

// Set favorite status of a message thread
export async function setFavorite(
  threadId: string,
  favourite: boolean
): Promise<MessageThread> {
  const response = await api.put(
    `/messagethreads/${threadId}/favorited`,
    favourite,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return safeParse(MessageThreadSchema, response.data, 'setFavorite');
}

// Rename a message thread
export async function renameThread(
  threadId: string,
  name: string
): Promise<MessageThread> {
  const response = await api.put(`/messagethreads/${threadId}/name`, name, {
    headers: { 'Content-Type': 'application/json' },
  });
  return safeParse(MessageThreadSchema, response.data, 'renameThread');
}

// Delete a message thread by ID
export async function deleteThread(threadId: string) {
  return await api.delete(`/messagethreads/${threadId}`);
}

// Create a new message thread
export async function createThread(
  name: string,
  workspaceId: string
){
  const response = await api.post(
    `workspaces/${workspaceId}/messageThreads`,
    { name }
  );
  return safeParse(MessageThreadSchema, response.data, 'createThread');
}



// Variable-related APIs moved to flowruns domain
