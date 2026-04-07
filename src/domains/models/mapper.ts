import type { z } from 'zod';

import {
  getModelsIdResponse as modelResponseSchema,
  getModelsResponse as modelsResponseSchema,
} from '@/platform/api/generated/chat/zod';

import { utcDate } from '@/shared/utils/dateFromApi';

import { Model } from './model';

type ModelsResponseDto = z.infer<typeof modelsResponseSchema>;
type ModelDto = ModelsResponseDto['data'][number];
type ModelDetailDto = z.infer<typeof modelResponseSchema>;

const toStringEnum = (value: unknown): string =>
  typeof value === 'number' || typeof value === 'string' ? String(value) : '';

function mapPropertyDtoToModel(
  p: ModelDto['properties'][number] | ModelDetailDto['properties'][number]
): Model['properties'][number] {
  // The API may still return these fields at runtime even though the spec omits them.
  const ext = p as Record<string, unknown>;
  return {
    name: p.name,
    type: toStringEnum(p.type),
    defaultValue: (ext.defaultValue as number) ?? 0,
    minValue: (ext.minValue as number) ?? 0,
    maxValue: (ext.maxValue as number) ?? 0,
    step: (ext.step as number) ?? 0,
  };
}

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
    createdAt: dto.createdAt ? utcDate(dto.createdAt) : new Date(0),
    properties: dto.properties.map(mapPropertyDtoToModel),
    virtualMachineUrl:
      ('virtualMachineUrl' in dto
        ? dto.virtualMachineUrl
        : (dto as { deployment?: { virtualMachineUrl?: string | null } })
            .deployment?.virtualMachineUrl) ?? null,
  };
}

export function mapModelsEnvelopeDtoToModels(dto: ModelsResponseDto): {
  data: Model[];
  total: number;
} {
  return { data: dto.data.map(mapModelDtoToModel), total: dto.total };
}
