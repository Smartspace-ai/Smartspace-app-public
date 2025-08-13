import { getModel, getModels } from '@/apis/models';
import { Model } from '@/models/model';
import { useQuery } from '@tanstack/react-query';

export function useModel(modelId: string) {
  const modelQuery = useQuery({
    queryKey: ['model', modelId],
    enabled: !!modelId,
    queryFn: async () => {
      if (!modelId) return Promise.reject('Model ID is required');
      return getModel(modelId);
    },
  });

  return modelQuery;
}

export const useQueryModels = ({
  search,
  page,
  limit,
}: {
  search: string;
  page: number;
  limit: number;
}) => {
  const queryModels = useQuery<Model[], Error>({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await getModels(search, page, limit);
      const models = response.data as Model[];
      return models.map((model) => new Model(model));
    },
    enabled: (!!page || page === 0) && !!limit,
  });

  return { queryModels };
};
