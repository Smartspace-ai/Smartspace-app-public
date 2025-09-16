import { useQuery } from '@tanstack/react-query';
import { filesKeys } from './queryKeys';
import { FileScope } from './schemas';
import { downloadFile } from './service';




export const useDownloadFileBlobQuery = (fileId: string, scope: FileScope) => {
  return useQuery({
    queryKey: filesKeys.downloadBlob(fileId),
    queryFn: async () => {
      return downloadFile(fileId, scope);
    },
    gcTime: 0,
    staleTime: 0,
    retry: 1,
  });
};

