import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useChatService } from '@/platform/chat';

import { FileInfo, FileScope } from './model';
import { filesKeys } from './queryKeys';

// All mutations and state for file management
export const useFileMutations = (scope: FileScope) => {
  const { workspaceId, threadId } = scope;
  const service = useChatService();
  const queryClient = useQueryClient();

  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});

  const clearUploadState = useCallback(() => {
    setUploadedFiles([]);
    setFileProgress({});
  }, []);

  const uploadFilesMutation = useMutation({
    mutationKey: filesKeys.mutation.upload(scope),
    mutationFn: async (files: File[]): Promise<FileInfo[]> => {
      clearUploadState();

      const progressTracker: Record<string, number> = {};

      const uploaded = await service.uploadFiles(
        files,
        scope,
        (file, fileInfo) => {
          setUploadedFiles((prev) => [...prev, fileInfo]);

          progressTracker[file.name] = 100;
          setFileProgress((prev) => ({ ...prev, [file.name]: 100 }));
        },
        (chunkIndex, totalChunks, file) => {
          const percent = Math.round((chunkIndex / totalChunks) * 100);
          progressTracker[file.name] = percent;
          setFileProgress((prev) => ({ ...prev, [file.name]: percent }));
        }
      );

      return uploaded ?? [];
    },
    onError: () => {
      toast.error('There was an error uploading your files.');
    },
  });

  const downloadFileMutation = useMutation({
    mutationFn: async (fileInfo: FileInfo) => {
      const blob = await service.downloadFile(fileInfo.id, scope);
      saveFile(blob, fileInfo.name);
    },
    onError: () => toast.error('Failed to download file'),
  });

  const downloadFileByUriMutation = useMutation({
    mutationFn: async ({
      name,
      sourceUri,
    }: {
      name: string;
      sourceUri: string;
    }) => {
      const uri = await service.getFileDownloadUrl(sourceUri);
      if (!uri) throw new Error('No download URL');
      const response = await fetch(uri);
      const blob = await response.blob();
      saveFile(blob, name);
      return blob;
    },
    onError: () => toast.error('Failed to download file'),
  });

  const fileStates = (files: File[]) =>
    files.map((file) => ({
      name: file.name,
      progress: fileProgress[file.name] ?? 0,
      status: uploadedFiles.some((f) => f.name === file.name)
        ? ('done' as const)
        : ('uploading' as const),
    }));

  // Cache blob URLs by file id across thread switches / remounts. File bytes
  // are immutable per id, so the entry never goes stale and we keep it for
  // the session (gcTime: Infinity). The blob memory survives until the page
  // unloads, which is fine for a chat session.
  const getFileBlobUrl = useCallback(
    (id: string) =>
      queryClient.fetchQuery({
        queryKey: filesKeys.downloadBlob(id),
        queryFn: async () => {
          const blob = await service.downloadFile(id, {
            workspaceId,
            threadId,
          });
          return URL.createObjectURL(blob);
        },
        staleTime: Infinity,
        gcTime: Infinity,
      }),
    [queryClient, service, workspaceId, threadId]
  );

  return {
    uploadFilesMutation,
    downloadFileMutation,
    downloadFileByUriMutation,
    getFileBlobUrl,
    fileProgress,
    uploadedFiles,
    clearUploadState,
    fileStates,
  };
};

// Utility function to save a file to disk
const saveFile = (blob: Blob, fileName: string) => {
  const a = document.createElement('a');
  a.download = fileName;
  a.href = URL.createObjectURL(blob);
  a.addEventListener('click', () => {
    setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
  });
  a.click();
};
