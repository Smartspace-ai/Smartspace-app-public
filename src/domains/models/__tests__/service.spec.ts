import { describe, expect, it, vi } from 'vitest';

import { apiMutator } from '@/platform/api/orvalMutator';

import { fetchModel, fetchModels } from '@/domains/models/service';

vi.mock('@/platform/api/orvalMutator', () => ({
  apiMutator: vi.fn(),
}));
vi.mock('@/platform/validation', () => ({
  parseOrThrow: vi.fn((_schema: unknown, data: unknown) => data),
}));

const mockedMutator = vi.mocked(apiMutator);

describe('models service', () => {
  it('fetchModels returns mapped list and total', async () => {
    const env = {
      data: [
        {
          id: 'm1',
          name: 'A',
          displayName: 'A',
          deploymentStatus: 'Ready',
          modelDeploymentProviderType: 'OpenAi',
          createdByUserId: 'u',
          createdAt: '2024',
          properties: [],
          virtualMachineUrl: null,
        },
      ],
      total: 1,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedMutator.mockResolvedValueOnce({ data: env } as any);
    const res = await fetchModels({ search: 'a', take: 10, skip: 0 });
    expect(res.total).toBe(1);
    expect(res.data[0].id).toBe('m1');
  });

  it('fetchModel returns mapped model', async () => {
    const dto = {
      id: 'm2',
      name: 'B',
      displayName: 'B',
      modelDeploymentProviderType: 'OpenAi',
      createdByUserId: 'u',
      createdAt: '2024',
      properties: [],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedMutator.mockResolvedValueOnce({ data: dto } as any);
    const m = await fetchModel('m2');
    expect(m.id).toBe('m2');
  });
});
