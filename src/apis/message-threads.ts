import { MessageThread } from '../models/message-threads';
import webApi from '../utils/axios-setup';

// Fetch threads for a given workspace
export async function fetchThreads(
  workspaceId?: string,
  { take, skip }: { take?: number; skip?: number } = {}
): Promise<{ threads: MessageThread[]; total: number }> {

  const response = await webApi.get(
    `workspaces/${workspaceId}/messagethreads`,
    { params: { take, skip } }
  );

  const threadsData = (response.data.data as MessageThread[]) || [];
  const total = response.data.total ?? threadsData.length;

  const threads = threadsData.map((thread) => new MessageThread(thread));

  return { threads, total };
}

// Toggle favorite status of a message thread
export async function toggleFavorite(
  thread: MessageThread,
  favourite: boolean
): Promise<MessageThread> {
  try {
    const response = await webApi.put(
      `/messagethreads/${thread.id}/favorited`,
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
    const response = await webApi.put(
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
    await webApi.delete(`/messagethreads/${threadId}`);
  } catch (error) {
    console.error('Error deleting thread:', error);
  }
}

// Upload files to a workspace
export async function uploadFiles(
  files: File[],
  workspaceId: string
): Promise<any[]> {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('workspaceId', workspaceId);

    const response = await webApi.post(`/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data;

    if (data && data.length > 0) {
      return data;
    }

    throw new Error('uploadFiles did not return a valid file object or array');
  } catch (error) {
    console.error('Error uploading files:', error);
    throw new Error('Failed to upload files');
  }
}

// Download file blob by ID
export async function downloadFile(id: string): Promise<Blob> {
  try {
    const response = await webApi.get(`/files/${id}/download`, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data as Blob;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file');
  }
}

// Create a new message thread
export async function createThread(
  name: string,
  workspaceId: string
): Promise<MessageThread> {
  try {
    const response = await webApi.post(
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
    const response = await webApi.patch(`/messagethreads/${threadId}`, updates);

    return new MessageThread(response.data);
  } catch (error) {
    console.error('Error updating thread:', error);
    throw new Error('Failed to update thread');
  }
}
