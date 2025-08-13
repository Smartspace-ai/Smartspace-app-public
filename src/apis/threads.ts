import webApi from '../utils/axios-setup';
import { MessageThread } from '../models/message-thread';
import { FileInfo } from '../models/file';
import { PaginationParams } from '@/models/react-query-params';

export const getMessageThreads = async (workspaceId: string, params: PaginationParams) => {
  return await webApi.get(`workspaces/${workspaceId}/messageThreads`, { params });
};

export const getThread = async (threadId: string) => {
  return await webApi.get(`/messagethreads/${threadId}`);
};

export const changeStatusFavorite = async ({
  thread,
  favourite,
}: {
  thread: MessageThread;
  favourite: boolean;
}) => {
  return await webApi.put(`/messagethreads/${thread.id}/favorited`, favourite, {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const changeName = async ({
  thread,
  name,
}: {
  thread: MessageThread;
  name: string;
}) => {
  return await webApi.put(`/messagethreads/${thread.id}/name`, name, {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const deleteThread = async (threadId: string) => {
  return await webApi.delete(`/messagethreads/${threadId}`);
};

export const uploadFiles = async (files: File[]): Promise<FileInfo[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await webApi.post(`/messageThreads/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data as FileInfo[];
};

export const downloadFile = async (id: string): Promise<Blob> => {
  const response = await webApi.get(`/messageThreads/files/${id}/download`, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data as Blob;
};



export const getThreadVariables = async (threadId: string): Promise<Record<string, any>> => {
  const response = await webApi.get(`/flowruns/${threadId}/variables`);
  return response.data as Record<string, any>;
}


export const updateVariable = async (
  threadId: string,
  variableName: string,
  value: any
): Promise<void> => {
  await webApi.put(`/flowruns/${threadId}/variables/${variableName}`, 
    value,
    { headers: { 'Content-Type': 'application/json' } }
  );
}