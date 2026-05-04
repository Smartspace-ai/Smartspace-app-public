import { queryOptions, useQuery } from '@tanstack/react-query';

import { useChatService } from '@/platform/chat';
import type { ChatService } from '@/platform/chat';

import { FileScope } from './model';
import { filesKeys } from './queryKeys';

export const downloadFileBlobOptions = (
  service: ChatService,
  fileId: string,
  scope: FileScope
) =>
  queryOptions({
    queryKey: filesKeys.downloadBlob(fileId),
    queryFn: () => service.downloadFile(fileId, scope),
    gcTime: 0,
    staleTime: 0,
    retry: 1,
  });

export const useDownloadFileBlobQuery = (fileId: string, scope: FileScope) => {
  const service = useChatService();
  return useQuery(downloadFileBlobOptions(service, fileId, scope));
};
