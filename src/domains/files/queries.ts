import { queryOptions, useQuery } from '@tanstack/react-query';

import { FileScope } from './model';
import { filesKeys } from './queryKeys';
import { downloadFile } from './service';




export const downloadFileBlobOptions = (fileId: string, scope: FileScope) =>
  queryOptions({
    queryKey: filesKeys.downloadBlob(fileId),
    queryFn: () => downloadFile(fileId, scope),
    gcTime: 0,
    staleTime: 0,
    retry: 1,
  });

export const useDownloadFileBlobQuery = (fileId: string, scope: FileScope) =>
  useQuery(downloadFileBlobOptions(fileId, scope));

