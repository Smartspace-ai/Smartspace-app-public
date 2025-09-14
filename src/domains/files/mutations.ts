import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { filesMutationKeys } from './queryKeys';
import { FileInfo, FileScope } from './schemas';
import { downloadFile, getFileDownloadUrl, uploadFiles } from './service';



// All mutations and state for file management
export const useFileMutations = (scope: FileScope) => {

  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});

  const clearUploadState = useCallback(() => {
    setUploadedFiles([]);
    setFileProgress({});
  }, []);

  const uploadFilesMutation = useMutation({
    mutationKey: filesMutationKeys.upload,
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
    mutationKey: filesMutationKeys.download,
    mutationFn: async (fileInfo: FileInfo) => {
      const blob = await downloadFile(fileInfo.id, scope);
      saveFile(blob, fileInfo.name);
    },
    onError: () => toast.error('Failed to download file'),
  });

  const downloadFileByUriMutation = useMutation({
    mutationKey: filesMutationKeys.downloadByUri,
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
    downloadFileByUriMutation,
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


