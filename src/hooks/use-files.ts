import { getFileDownloadUrl } from '@/apis/files';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMatch } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { downloadFile, getFileInfo, uploadFiles } from '../apis/files';
import { FileInfo } from '../models/file';

// Hook for downloading a file from a secured source URI
export const useQueryFiles = () => {
  const downloadFileMutation = useMutation({
    mutationFn: async ({
      name,
      sourceUri,
    }: {
      name: string;
      sourceUri: string;
    }) => {
      try {
        const uri = await getFileDownloadUrl(sourceUri);

        const response = await fetch(uri, {
          method: 'GET',
        });

        const blob = await response.blob();

        // Create a temporary anchor to trigger file download
        const a = document.createElement('a');
        a.download = name;
        a.href = URL.createObjectURL(blob);

        // Cleanup the object URL after some time
        a.addEventListener('click', () => {
          setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
        });

        a.click();
      } catch (error) {
        throw new Error('Failed to download the file');
      }
    },
    onError: () => {
      toast.error('Failed to download source file');
    },
  });

  return {
    downloadFileMutation,
  };
};




// Custom hook for getting a specific file's info
export const useQueryFileInfo = (id?: string) => {
  const threadMatch = useMatch({ from: '/_protected/workspace/$workspaceId/thread/$threadId', shouldThrow: false });
  const scope = { workspaceId: threadMatch?.params?.workspaceId, threadId: threadMatch?.params?.threadId } as { workspaceId?: string, threadId?: string };

  return useQuery<FileInfo, Error>({
    queryKey: ['fileInfo', id, scope],
    queryFn: async () => {
      if (!id) throw new Error('File ID is required');
      return await getFileInfo(id, scope);
    },
    enabled: !!id,
  });
};

// All mutations and state for file management
export const useFileMutations = () => {
  const threadMatch = useMatch({ from: '/_protected/workspace/$workspaceId/thread/$threadId', shouldThrow: false });
  const scope = { workspaceId: threadMatch?.params?.workspaceId, threadId: threadMatch?.params?.threadId } as { workspaceId?: string, threadId?: string };

  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});

  const clearUploadState = useCallback(() => {
    setUploadedFiles([]);
    setFileProgress({});
  }, []);

  const uploadFilesMutation = useMutation({
    mutationFn: async (files: File[]): Promise<FileInfo[]> => {
      clearUploadState();

      const progressTracker: Record<string, number> = {};

      const uploaded = await uploadFiles(
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
        },
      );

      return uploaded ?? [];
    },
    onError: () => {
      toast.error('There was an error uploading your files.');
    },
  });

  const downloadFileMutation = useMutation({
    mutationFn: async (fileInfo: FileInfo) => {
      const blob = await downloadFile(fileInfo.id, scope);
      saveFile(blob, fileInfo.name);
    },
    onError: () => toast.error('Failed to download file'),
  });

  const downloadFileBlobMutation = useMutation({
    mutationFn: (fileInfo: FileInfo) => downloadFile(fileInfo.id, scope),
    onError: () => toast.error('Failed to fetch file data'),
  });

  const downloadFileByUriMutation = useMutation({
    mutationFn: async ({
      name,
      sourceUri,
    }: {
      name: string;
      sourceUri: string;
    }) => {
      const uri = await getFileDownloadUrl(sourceUri);
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

  return {
    uploadFilesMutation,
    downloadFileMutation,
    downloadFileBlobMutation,
    downloadFileByUriMutation,
    fileProgress,
    uploadedFiles,
    clearUploadState,
    fileStates,
  };
};

// Utility function to save a file to disk
export const saveFile = (blob: Blob, fileName: string) => {
  const a = document.createElement('a');
  a.download = fileName;
  a.href = URL.createObjectURL(blob);
  a.addEventListener('click', () => {
    setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
  });
  a.click();
};


