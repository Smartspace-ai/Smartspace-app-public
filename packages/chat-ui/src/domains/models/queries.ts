import { queryOptions, useQuery } from '@tanstack/react-query';

import { useChatService } from '@/platform/chat';

import { modelsKeys } from './queryKeys';

/**
 * List models the user has access to. Drives the model-id renderer in
 * the chat variables form (a searchable dropdown of models).
 */
export function useModels({
  search,
  take,
  skip,
}: { search?: string; take?: number; skip?: number } = {}) {
  const service = useChatService();
  return useQuery(
    queryOptions({
      queryKey: modelsKeys.list({ search, take, skip }),
      queryFn: () => service.fetchModels({ search, take, skip }),
      refetchOnWindowFocus: false,
    })
  );
}
