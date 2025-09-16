import { api } from '@/platform/api/apiClient';
import { Model, ModelSchema, ModelsEnvelopeSchema } from './schemas';

// Fetch threads for a given workspace
export async function fetchModels({
  search,
  take,
  skip,
}: { search?: string; take?: number; skip?: number } = {}): Promise<{
  data: Model[];
  total: number;
}> {
  const response = await api.get(`models`, {
    params: { search, take, skip },
  });

  return ModelsEnvelopeSchema.parse(response.data.data);
}

export async function fetchModel(id: string): Promise<Model> {
  const response = await api.get(`models/${id}`);
  return ModelSchema.parse(response.data);
}
