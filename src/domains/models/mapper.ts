import { ModelDto, ModelsEnvelopeDto, TModelDto, TModelsEnvelopeDto } from './dto';
import { Model } from './model';

export function mapModelDtoToModel(dto: TModelDto): Model {
  const parsed = ModelDto.parse(dto);
  return parsed;
}

export function mapModelsEnvelopeDtoToModels(dto: TModelsEnvelopeDto): { data: Model[]; total: number } {
  const env = ModelsEnvelopeDto.parse(dto);
  return { data: env.data.map(mapModelDtoToModel), total: env.total };
}






