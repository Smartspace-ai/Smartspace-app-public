import { Model } from '@/models/model';
import { api } from '@/platform/api/apiClient';

// Fetch threads for a given workspace
export async function fetchModels(
  { search, take, skip }: { search?: string; take?: number; skip?: number } = {}
): Promise<{ data: Model[]; total: number }> {

  const response = await api.get(
    `models`,
    { params: { search, take, skip } }
  );

  const modelsMap = (response.data.data as Model[]) || [];
  const total = response.data.total ?? modelsMap.length;

  const models = modelsMap.map((model) => new Model(model));

  return { data: models, total };
}

export async function fetchModel(
  id: string,
): Promise<Model> {
  const response = await api.get(
    `models/${id}`
  );

  return response.data as Model;
}