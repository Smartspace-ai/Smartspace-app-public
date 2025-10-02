import { api } from '@/platform/api/apiClient';
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
  return ThreadsResponseSchema.parse(response.data);
}

export async function fetchThread(
  workspaceId: string,  
  id: string
): Promise<MessageThread> {
  const response = await api.get(
    `workspaces/${workspaceId}/messagethreads/${id}`
  );
  return MessageThreadSchema.parse(response.data);
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

  return MessageThreadSchema.parse(response.data);
}

// Rename a message thread
export async function renameThread(
  threadId: string,
  name: string
): Promise<MessageThread> {
  const response = await api.put(`/messagethreads/${threadId}/name`, name, {
    headers: { 'Content-Type': 'application/json' },
  });
  return MessageThreadSchema.parse(response.data);
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
  return MessageThreadSchema.parse(response.data);
}



// Variable-related APIs moved to flowruns domain
