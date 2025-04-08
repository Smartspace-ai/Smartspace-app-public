import { MessageThread } from '../models/message-threads';
import webApi from '../utils/axios-setup';

/**
 * Fetches threads, optionally filtered by workspace ID
 */
export async function fetchThreads(
  workspaceId?: string
): Promise<MessageThread[]> {
  try {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    const response = await webApi.get(
      `workspaces/${workspaceId}/messagethreads`
    );
    const threads = (response.data.data as MessageThread[]) || [];
    return threads.map((thread: MessageThread) => new MessageThread(thread));
  } catch (error) {
    console.error('Error fetching threads:', error);
    return [];
  }
}

/**
 * Changes the favorite status of a thread
 */
export async function toggleFavorite(
  thread: MessageThread,
  favourite: boolean
): Promise<MessageThread> {
  try {
    const response = await webApi.put(
      `/messagethreads/${thread.id}/favorited`,
      favourite,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return new MessageThread(response.data);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw new Error('Error toggling favorite');
  }
}

/**
 * Changes the name of a thread
 */
export async function renameThread(
  thread: MessageThread,
  name: string
): Promise<MessageThread> {
  try {
    const response = await webApi.put(
      `/messagethreads/${thread.id}/name`,
      name,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return new MessageThread(response.data);
  } catch (error) {
    console.error('Error renaming thread:', error);
    throw new Error('Error renaming thread');
  }
}

/**
 * Deletes a thread
 */
export async function deleteThread(threadId: string): Promise<void> {
  try {
    await webApi.delete(`/messagethreads/${threadId}`);
  } catch (error) {
    console.error('Error deleting thread:', error);
  }
}

/**
 * Uploads files
 */
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

    console.log('Response from uploadFiles:', response.data);

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

/**
 * Downloads a file
 */
export async function downloadFile(id: string): Promise<Blob> {
  try {
    const response = await webApi.get(`/messageThreads/files/${id}/download`, {
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

/**
 * Creates a new thread
 */
export async function createThread(
  name: string,
  workspaceId: string
): Promise<MessageThread> {
  try {
    const response = await webApi.post(
      `workspaces/${workspaceId}/messageThreads`,
      {
        name,
      }
    );

    return new MessageThread(response.data);
  } catch (error) {
    console.error('Error creating thread:', error);
    throw new Error('Failed to create thread');
  }
}

/**
 * Updates a thread
 */
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
