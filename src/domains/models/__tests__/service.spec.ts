import { describe, expect, it, vi } from 'vitest';

import { apiParsed } from '@/platform/apiParsed';

import { fetchModel, fetchModels } from '@/domains/models/service';

describe('models service', () => {
  it('fetchModels returns mapped list and total', async () => {
    const env = { data: [{ id: 'm1', name: 'A', displayName: 'A', deploymentStatus: 'x', modelDeploymentProviderType: 'y', createdByUserId: 'u', createdAt: '2024', properties: [], virtualMachineUrl: null }], total: 1 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed, 'get').mockResolvedValueOnce(env as any);
    const res = await fetchModels({ search: 'a', take: 10, skip: 0 });
    expect(res.total).toBe(1);
    expect(res.data[0].id).toBe('m1');
    spy.mockRestore();
  });

  it('fetchModel returns mapped model', async () => {
    const dto = { id: 'm2', name: 'B', displayName: 'B', deploymentStatus: 'x', modelDeploymentProviderType: 'y', createdByUserId: 'u', createdAt: '2024', properties: [], virtualMachineUrl: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed, 'get').mockResolvedValueOnce(dto as any);
    const m = await fetchModel('m2');
    expect(m.id).toBe('m2');
    spy.mockRestore();
  });
});


