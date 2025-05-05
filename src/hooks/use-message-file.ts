import { useQuery } from '@tanstack/react-query';
import { downloadFile } from '../apis/message-threads';

// Hook to fetch and cache a single file blob by ID
export const useMessageFile = (id: string) => {
  const useMessageFileRaw = useQuery<Blob, Error>({
    queryKey: ['messagefile', id, 'download'],
    queryFn: async () => {
      return await downloadFile(id);
    },
    enabled: !!id,
  });

  return { useMessageFileRaw };
};

// Utility to save a file locally from a Blob
export const saveFile = async (blob: Blob, fileName: string) => {
  const a = document.createElement('a');
  a.download = fileName;
  a.href = URL.createObjectURL(blob);

  // Clean up after a short delay to prevent memory leaks
  a.addEventListener('click', () => {
    setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
  });

  a.click();
};
