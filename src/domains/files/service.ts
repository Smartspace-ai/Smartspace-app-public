import { api } from '@/platform/api';
import { getSmartSpaceChatAPI } from '@/platform/api/generated/chat/api';
import {
  getFilesIdResponse as fileInfoResponseSchema,
  postFilesResponse as filesResponseSchema,
} from '@/platform/api/generated/chat/zod';
import { parseOrThrow } from '@/platform/validation';

import { mapFileInfoDtoToModel } from './mapper';
import type { FileInfo, FileScope } from './model';

export const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB

const chatApi = getSmartSpaceChatAPI();

const uploadFileInChunks = async (
  file: File,
  scope: FileScope,
  onChunkUploaded?: (
    chunkIndex: number,
    totalChunks: number,
    file: File
  ) => void
): Promise<FileInfo> => {
  const uploadId = crypto.randomUUID();
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkFile = new File([chunk], file.name, { type: file.type });
    const response = await chatApi.postFiles({
      files: [chunkFile],
      uploadId,
      chunkIndex: i,
      totalChunks,
      lastChunk: i === totalChunks - 1,
      workspaceId: scope.workspaceId,
      threadId: scope.threadId,
    });

    // Call the per-chunk callback
    if (onChunkUploaded) onChunkUploaded(i + 1, totalChunks, file);

    // Only the last chunk returns the file info
    if (i === totalChunks - 1) {
      const parsed = parseOrThrow(
        filesResponseSchema,
        response.data,
        'POST /files (chunked)'
      );
      return mapFileInfoDtoToModel(parsed[0]);
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
    file: File
  ) => void
): Promise<FileInfo[]> => {
  const results: FileInfo[] = [];
  for (const file of files) {
    let fileInfo: FileInfo;
    if (file.size > CHUNK_SIZE) {
      fileInfo = await uploadFileInChunks(file, scope, onChunkUploaded);
    } else {
      // Use the same endpoint for small files
      const response = await chatApi.postFiles({
        files: [file],
        workspaceId: scope.workspaceId,
        threadId: scope.threadId,
      });
      const parsed = parseOrThrow(
        filesResponseSchema,
        response.data,
        'POST /files'
      );
      fileInfo = mapFileInfoDtoToModel(parsed[0]);
    }
    results.push(fileInfo);
    if (onFileUploaded) onFileUploaded(file, fileInfo);
  }
  return results;
};

export const downloadFile = async (
  id: string,
  scope?: FileScope
): Promise<Blob> => {
  const blob = await api.get<Blob>(`/files/${id}/download`, {
    responseType: 'blob',
    params: scope,
  });
  return blob;
};

export const getFileInfo = async (
  id: string,
  scope: FileScope
): Promise<FileInfo> => {
  const response = await chatApi.getFilesId(id, scope);
  const parsed = parseOrThrow(
    fileInfoResponseSchema,
    response.data,
    `GET /files/${id}`
  );
  return mapFileInfoDtoToModel(parsed);
};

export const getFileDownloadUrl = async (
  sourceUri: string
): Promise<string> => {
  const data = await api.get<{ uri: string }>(sourceUri);
  const uri = data?.uri;
  if (!uri) throw new Error('Download URL is missing');
  return uri;
};

export const downloadBlob = async (sourceUri: string) => {
  return await api.get<Blob>(sourceUri);
};
