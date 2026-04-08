import { ChatApi, ChatZod } from '@smartspace/api-client';

import { parseOrThrow } from '@/platform/validation';

import { mapModelDtoToModel, mapModelsEnvelopeDtoToModels } from './mapper';
import { Model } from './model';

const {
  getModelsIdResponse: modelResponseSchema,
  getModelsResponse: modelsResponseSchema,
} = ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

// Fetch threads for a given workspace
export async function fetchModels({
  search,
  take,
  skip,
}: { search?: string; take?: number; skip?: number } = {}): Promise<{
  data: Model[];
  total: number;
}> {
  const response = await chatApi.getModels({ search, take, skip });
  const parsed = parseOrThrow(
    modelsResponseSchema,
    response.data,
    'GET /models'
  );
  const result = mapModelsEnvelopeDtoToModels(parsed);
  return result;
}

export async function fetchModel(id: string): Promise<Model> {
  const response = await chatApi.getModelsId(id);
  const parsed = parseOrThrow(
    modelResponseSchema,
    response.data,
    `GET /models/${id}`
  );
  return mapModelDtoToModel(parsed);
}
