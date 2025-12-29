import { api } from '@/platform/api';

import { FileInfoDto } from './dto';
import { mapFileInfoDtoToModel } from './mapper';
import type { FileInfo, FileScope } from './model';

export const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB


const uploadFileInChunks = async (
  file: File,
  scope: FileScope,
  onChunkUploaded?: (
    chunkIndex: number,
    totalChunks: number,
    file: File,
  ) => void,
): Promise<FileInfo> => {
  const uploadId = crypto.randomUUID();
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const formData = new FormData();
    formData.append('files', chunk, file.name);
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', i.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('lastChunk', (i === totalChunks - 1).toString());
    if (scope.workspaceId) formData.append('workspaceId', scope.workspaceId);
    if (scope.threadId) formData.append('threadId', scope.threadId);

    const response = await api.post<unknown>(`/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Call the per-chunk callback
    if (onChunkUploaded) onChunkUploaded(i + 1, totalChunks, file);

    // Only the last chunk returns the file info
    if (i === totalChunks - 1) {
      const data = response as unknown as unknown[];
      const parsed = FileInfoDto.parse(data[0]);
      return mapFileInfoDtoToModel(parsed);
    }
  }
  throw new Error('Chunked upload did not complete.');
};

export const uploadFiles = async (
  files: File[],
  scope: FileScope,
  onFileUploaded?: (file: File, fileInfo: FileInfo) => void,
  onChunkUploaded?: (
    chunkIndex: number,
    totalChunks: number,
    file: File,
  ) => void,
): Promise<FileInfo[]> => {
  const results: FileInfo[] = [];
  for (const file of files) {
    let fileInfo: FileInfo;
    if (file.size > CHUNK_SIZE) {
      fileInfo = await uploadFileInChunks(file, scope, onChunkUploaded);
    } else {
      // Use the same endpoint for small files
      const formData = new FormData();
      formData.append('files', file);
      if (scope.workspaceId) formData.append('workspaceId', scope.workspaceId);
      if (scope.threadId) formData.append('threadId', scope.threadId);

      const response = await api.post<unknown>(`/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = response as unknown as unknown[];
      fileInfo = mapFileInfoDtoToModel(FileInfoDto.parse(data[0]));
    }
    results.push(fileInfo);
    if (onFileUploaded) onFileUploaded(file, fileInfo);
  }
  return results;
};

export const downloadFile = async (
  id: string,
  scope?: FileScope,
): Promise<Blob> => {
  const blob = await api.get<Blob>(`/files/${id}/download`, {
    responseType: 'blob',
    params: scope,
  });
  return blob;
};

export const getFileInfo = async (
  id: string,
  scope: FileScope,
): Promise<FileInfo> => {
  const data = await api.get<unknown>(`/files/${id}`, {
    params: scope,
  });

  return mapFileInfoDtoToModel(FileInfoDto.parse(data));
};

export const getFileDownloadUrl = async (sourceUri: string): Promise<string> => {
  const data = await api.get<{ uri: string }>(sourceUri);
  const uri = data?.uri;
  if (!uri) throw new Error('Download URL is missing');
  return uri;
};

export const downloadBlob = async (sourceUri: string) => {
  return await api.get<Blob>(sourceUri);
};
