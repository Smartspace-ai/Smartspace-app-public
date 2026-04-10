import { describe, expect, it, vi } from 'vitest';

const { mockGetModels, mockGetModelsId } = vi.hoisted(() => ({
  mockGetModels: vi.fn(),
  mockGetModelsId: vi.fn(),
}));

vi.mock('@smartspace/api-client', () => ({
  ChatApi: {
    getSmartSpaceChatAPI: () => ({
      modelsGetModels: mockGetModels,
      modelsGetModel: mockGetModelsId,
    }),
  },
  ChatZod: {
    modelsGetModelsResponse: {},
    modelsGetModelResponse: {},
  },
  AXIOS_INSTANCE: {},
}));
vi.mock('@/platform/validation', () => ({
  parseOrThrow: vi.fn((_schema: unknown, data: unknown) => data),
}));

import { fetchModel, fetchModels } from '@/domains/models/service';

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
          createdAt: '2024-06-01T12:00:00Z',
          properties: [],
          virtualMachineUrl: null,
        },
      ],
      total: 1,
    };
    mockGetModels.mockResolvedValueOnce({ data: env });
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
      createdAt: '2024-06-01T12:00:00Z',
      properties: [],
    };
    mockGetModelsId.mockResolvedValueOnce({ data: dto });
    const m = await fetchModel('m2');
    expect(m.id).toBe('m2');
  });
});
