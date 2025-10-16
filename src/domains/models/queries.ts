import { queryOptions, useQuery } from '@tanstack/react-query';

import { modelsKeys } from './queryKeys';
import { fetchModel, fetchModels } from './service';

export const modelDetailOptions = (modelId: string) =>
  queryOptions({
    queryKey: modelsKeys.detail(modelId),
    queryFn: async () => fetchModel(modelId),
  });

export function useModel({ modelId }: { modelId: string }) {
  return useQuery({ ...modelDetailOptions(modelId), enabled: !!modelId });
}

export const modelsListOptions = ({ search, take, skip }: { search?: string; take?: number; skip?: number } = {}) =>
  queryOptions({
    queryKey: modelsKeys.list({ search, take, skip }),
    queryFn: async () => fetchModels({ search, take, skip }),
    refetchOnWindowFocus: false,
  });

export function useModels({ search, take, skip }: { search?: string; take?: number; skip?: number } = {}) {
  return useQuery(modelsListOptions({ search, take, skip }));
}

