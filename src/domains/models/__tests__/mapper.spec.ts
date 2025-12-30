import { describe, expect, it } from 'vitest';

import { mapModelDtoToModel, mapModelsEnvelopeDtoToModels } from '@/domains/models/mapper';

describe('models mapper', () => {
  it('maps single model dto as-is (validated)', () => {
    const dto = { id: 'm1', name: 'A', displayName: 'A', deploymentStatus: 'x', modelDeploymentProviderType: 'y', createdByUserId: 'u', createdAt: '2024', properties: [], virtualMachineUrl: null } as any;
    const m = mapModelDtoToModel(dto);
    expect(m.id).toBe('m1');
  });

  it('maps envelope', () => {
    const env = { data: [{ id: 'm2', name: 'B', displayName: 'B', deploymentStatus: 'x', modelDeploymentProviderType: 'y', createdByUserId: 'u', createdAt: '2024', properties: [], virtualMachineUrl: null }], total: 1 } as any;
    const res = mapModelsEnvelopeDtoToModels(env);
    expect(res.total).toBe(1);
    expect(res.data[0].id).toBe('m2');
  });
});


