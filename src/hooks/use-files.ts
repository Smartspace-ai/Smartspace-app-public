import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getFileDownloadUrl } from '../apis/workspace-files';

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
