
import { useQuery } from '@tanstack/react-query';
import { modelsKeys } from './queryKeys';
import { fetchModel, fetchModels } from './service';

export function useModel({modelId}: { modelId: string }) {
  return useQuery({
    queryKey: modelsKeys.detail(modelId),
    enabled: !!modelId,
    queryFn: async () => {
      return fetchModel(modelId);
    },
  });
  
}

export function useModels({ search, take, skip }: { search?: string; take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: modelsKeys.list({ search, take, skip }),
    queryFn: async () => {
      return fetchModels({ search, take, skip });
    },
    refetchOnWindowFocus: false,
  });

}

