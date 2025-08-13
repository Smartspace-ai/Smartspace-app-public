
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { getFileDownloadUrl } from '../../apis/files'; 
import { useQuery } from '@tanstack/react-query';

import { downloadFile } from '../../apis/files';

// Hook to fetch and cache a single file blob by ID
export const useQueryFile = (id: string) => {
  const useMessageFileRaw = useQuery<Blob, Error>({
    queryKey: ['messagefile', id, 'download'],
    queryFn: async () => {
      return await downloadFile(id);
    },
    enabled: !!id,
  });

  return { useMessageFileRaw };
};



export const useFileMutations = () => {
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
        const a = document.createElement('a');
        a.download = name;
        a.href = URL.createObjectURL(blob);
        a.addEventListener('click', (e) => {
          setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
        });
        a.click();
      } catch (error) {
        throw new Error('Failed to download the file');
      }
    },
    onError: (error) => {
      toast.error('Failed to download source file');
    },
  });

  return {
    downloadFileMutation,
  };
};
