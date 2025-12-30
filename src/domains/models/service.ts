import { apiParsed } from '@/platform/apiParsed';

import { ModelDto, ModelsEnvelopeDto } from './dto';
import { mapModelDtoToModel, mapModelsEnvelopeDtoToModels } from './mapper';
import { Model } from './model';

// Fetch threads for a given workspace
export async function fetchModels({
  search,
  take,
  skip,
}: { search?: string; take?: number; skip?: number } = {}): Promise<{
  data: Model[];
  total: number;
}> {
  const envelope = await apiParsed.get(ModelsEnvelopeDto, `models`, { params: { search, take, skip } });
  const result = mapModelsEnvelopeDtoToModels(envelope);
  return result;
}

export async function fetchModel(id: string): Promise<Model> {
  const dto = await apiParsed.get(ModelDto, `models/${id}`);
  return mapModelDtoToModel(dto);
}
