import { api } from '@/platform/api/apiClient';
import { safeParse } from '@/shared/utils/safeParse';
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

  console.log('Models API response:', response.data);
  const result = safeParse(ModelsEnvelopeSchema, response.data, 'fetchModels');
  console.log('Parsed models result:', result);
  return result;
}

export async function fetchModel(id: string): Promise<Model> {
  const response = await api.get(`models/${id}`);
  return safeParse(ModelSchema, response.data, 'fetchModel');
}
