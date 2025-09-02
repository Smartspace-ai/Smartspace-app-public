import webApi from '@/domains/auth/axios-setup';

export interface FileInfo {
  id: string;
  name: string;
}

interface FileScope {
  workspaceId?: string;
  threadId?: string;
}

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

    const response = await webApi.post(`/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Call the per-chunk callback
    if (onChunkUploaded) onChunkUploaded(i + 1, totalChunks, file);

    // Only the last chunk returns the file info
    if (i === totalChunks - 1) {
      return response.data[0];
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

      const response = await webApi.post(`/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fileInfo = (response.data as FileInfo[])[0];
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
  // For GET requests, we need to use params for scope
  const response = await webApi.get(`/files/${id}/download`, {
    responseType: 'blob',
    params: scope,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data as Blob;
};

export const getFileInfo = async (
  id: string,
  scope: FileScope,
): Promise<FileInfo> => {
  const response = await webApi.get(`/files/${id}`, {
    params: scope,
  });

  return response.data as FileInfo;
};

export const getFileDownloadUrl = async (sourceUri: string) => {
  const response = await webApi.get(sourceUri);

  return response.data?.uri;
};

export const downloadBlob = async (sourceUri: string) => {
  return (await webApi.get(sourceUri)) as Blob;
};
