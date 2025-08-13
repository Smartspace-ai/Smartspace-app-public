  
import webApi from '../utils/axios-setup';
import { FileInfo } from '@/models/file';

export const getFileDownloadUrl = async (sourceUri: string) => {
  const response = await webApi.get(sourceUri);

  return response.data?.uri;
};

export const downloadBlob = async (sourceUri: string) => {
  return (await webApi.get(sourceUri)) as Blob;
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
