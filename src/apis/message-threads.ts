import { api } from '@/platform/api/apiClient';
import { MessageThread } from '../models/message-thread';

// Fetch threads for a given workspace
export async function fetchThreads(
  workspaceId?: string,
  { take, skip }: { take?: number; skip?: number } = {}
): Promise<{ threads: MessageThread[]; total: number }> {

  const response = await api.get(
    `workspaces/${workspaceId}/messagethreads`,
    { params: { take, skip } }
  );

  const threadsData = (response.data.data as MessageThread[]) || [];
  const total = response.data.total ?? threadsData.length;

  const threads = threadsData.map((thread) => new MessageThread(thread));

  return { threads, total };
}

export async function fetchThread(
  workspaceId: string, id: string,
): Promise<MessageThread> {
  const response = await api.get(
    `workspaces/${workspaceId}/messagethreads/${id}`
  );

  return response.data as MessageThread;
}

// Set favorite status of a message thread
export async function setFavorite(
  threadId: string,
  favourite: boolean
): Promise<MessageThread> {
  try {
    const response = await api.put(
      `/messagethreads/${threadId}/favorited`,
      favourite,
      { headers: { 'Content-Type': 'application/json' } }
    );

    return new MessageThread(response.data);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw new Error('Error toggling favorite');
  }
}

// Rename a message thread
export async function renameThread(
  thread: MessageThread,
  name: string
): Promise<MessageThread> {
  try {
    const response = await api.put(
      `/messagethreads/${thread.id}/name`,
      name,
      { headers: { 'Content-Type': 'application/json' } }
    );

    return new MessageThread(response.data);
  } catch (error) {
    console.error('Error renaming thread:', error);
    throw new Error('Error renaming thread');
  }
}

// Delete a message thread by ID
export async function deleteThread(threadId: string): Promise<void> {
  try {
    await api.delete(`/messagethreads/${threadId}`);
  } catch (error) {
    console.error('Error deleting thread:', error);
  }
}

// Create a new message thread
export async function createThread(
  name: string,
  workspaceId: string
): Promise<MessageThread> {
  try {
    const response = await api.post(
      `workspaces/${workspaceId}/messageThreads`,
      { name }
    );

    return new MessageThread(response.data);
  } catch (error) {
    console.error('Error creating thread:', error);
    throw new Error('Failed to create thread');
  }
}

// Update properties of a message thread
export async function updateThread(
  threadId: string,
  updates: Partial<MessageThread>
): Promise<MessageThread> {
  try {
    const response = await api.patch(`/messagethreads/${threadId}`, updates);

    return new MessageThread(response.data);
  } catch (error) {
    console.error('Error updating thread:', error);
    throw new Error('Failed to update thread');
  }
}

export async function fetchThreadVariables(threadId: string): Promise<Record<string, any>> {
  const response = await api.get(`/flowruns/${threadId}/variables`);
  return response.data as Record<string, any>;
}


// Updates a variable
export async function updateVariable(
  flowRunId: string,
  variableName: string,
  value: any
): Promise<void> {
  await api.put(`/flowruns/${flowRunId}/variables/${variableName}`, 
    value,
    { headers: { 'Content-Type': 'application/json' } }
  );
}
