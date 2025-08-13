import { Model } from '@/models/model';
import webApi from '../utils/axios-setup';

export async function getModels(
  search: string,
  page: number,
  limit: number,
): Promise<{
  data: Model[];
  total: number;
}> {
  const response = await webApi.get(`models`, {
    params: {
      take: limit,
      skip: limit * page,
      search,
    },
  });

  const modelsMap = (response.data.data as Model[]) || [];
  const total = response.data.total ?? modelsMap.length;

  const models = modelsMap.map((model) => new Model(model));

  return { data: models, total };
}

export async function getModel(id: string) {
  return await webApi.get(`models/${id}`);
}
