import { describe, expect, it } from 'vitest';

import {
  mapModelDtoToModel,
  mapModelsEnvelopeDtoToModels,
} from '@/domains/models/mapper';

describe('models mapper', () => {
  it('maps single model dto as-is (validated)', () => {
    const dto = {
      id: 'm1',
      name: 'A',
      displayName: 'A',
      deploymentStatus: 'x',
      modelDeploymentProviderType: 'y',
      modelPublisher: null,
      createdByUserId: 'u',
      createdAt: '2024-06-01T12:00:00Z',
      properties: [],
      virtualMachineUrl: null,
    } as any;
    const m = mapModelDtoToModel(dto);
    expect(m.id).toBe('m1');
    expect(m.createdAt).toBeInstanceOf(Date);
    expect(m.createdAt.toISOString()).toBe('2024-06-01T12:00:00.000Z');
  });

  it('maps envelope', () => {
    const env = {
      data: [
        {
          id: 'm2',
          name: 'B',
          displayName: 'B',
          deploymentStatus: 'x',
          modelDeploymentProviderType: 'y',
          createdByUserId: 'u',
          createdAt: '2024-06-01T12:00:00Z',
          properties: [],
          virtualMachineUrl: null,
        },
      ],
      total: 1,
    } as any;
    const res = mapModelsEnvelopeDtoToModels(env);
    expect(res.total).toBe(1);
    expect(res.data[0].id).toBe('m2');
  });
});
