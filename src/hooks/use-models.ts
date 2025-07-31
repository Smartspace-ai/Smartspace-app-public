
import { fetchModel, fetchModels } from '@/apis/models';
import { useQuery } from '@tanstack/react-query';

export function useModel({modelId}: { modelId?: string }) {
  const modelQuery = useQuery({
    queryKey: ['model', modelId],
    enabled: !!modelId,
    queryFn: async () => {
      return fetchModel(modelId!);
    },
  });

  return modelQuery;
}

export function useModels({ search, take, skip }: { search?: string; take?: number; skip?: number } = {}) {
  const modelsQuery = useQuery({
    queryKey: ['models', { search, take, skip }],
    queryFn: async () => {
      return fetchModels({ search, take, skip });
    },
    refetchOnWindowFocus: false,
  });

  return modelsQuery;
}

