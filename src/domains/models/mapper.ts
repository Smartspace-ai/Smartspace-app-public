import type { z } from 'zod';

import {
  getModelsIdResponse as modelResponseSchema,
  getModelsResponse as modelsResponseSchema,
} from '@/platform/api/generated/chat/zod';

import { parseIsoDate } from '@/shared/utils/parseIsoDate';

import { Model } from './model';

type ModelsResponseDto = z.infer<typeof modelsResponseSchema>;
type ModelDto = ModelsResponseDto['data'][number];
type ModelDetailDto = z.infer<typeof modelResponseSchema>;

const toStringEnum = (value: unknown): string =>
  typeof value === 'number' || typeof value === 'string' ? String(value) : '';

export function mapModelDtoToModel(dto: ModelDto | ModelDetailDto): Model {
  return {
    id: dto.id,
    name: dto.name,
    displayName: dto.displayName,
    deploymentStatus: toStringEnum(
      (dto as { deploymentStatus?: unknown }).deploymentStatus
    ),
    modelDeploymentProviderType: toStringEnum(dto.modelDeploymentProviderType),
    createdByUserId: dto.createdByUserId ?? '',
    createdAt: dto.createdAt
      ? parseIsoDate(dto.createdAt, 'createdAt').toISOString()
      : '',
    properties: dto.properties,
    virtualMachineUrl: dto.virtualMachineUrl ?? null,
  };
}

export function mapModelsEnvelopeDtoToModels(dto: ModelsResponseDto): {
  data: Model[];
  total: number;
} {
  return { data: dto.data.map(mapModelDtoToModel), total: dto.total };
}
