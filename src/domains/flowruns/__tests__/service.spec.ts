import { describe, expect, it, vi } from 'vitest';

import { api } from '@/platform/api';

const { mockGetFlowRunsIdVariables } = vi.hoisted(() => ({
  mockGetFlowRunsIdVariables: vi.fn(),
}));

vi.mock('@smartspace/api-client', () => ({
  ChatApi: {
    getSmartSpaceChatAPI: () => ({
      getFlowRunsIdVariables: mockGetFlowRunsIdVariables,
    }),
  },
  ChatZod: {
    getFlowRunsIdVariablesResponse: {},
  },
  AXIOS_INSTANCE: {},
}));
vi.mock('@/platform/validation', () => ({
  parseOrThrow: vi.fn((_schema: unknown, data: unknown) => data),
}));

import {
  fetchFlowRunVariables,
  updateFlowRunVariable,
} from '@/domains/flowruns/service';

describe('flowruns service', () => {
  it('fetchFlowRunVariables returns mapped record', async () => {
    mockGetFlowRunsIdVariables.mockResolvedValueOnce({
      data: { a: 1, b: 'x' },
    });
    const res = await fetchFlowRunVariables('f1');
    expect(res).toMatchObject({ a: 1, b: 'x' });
  });

  it('updateFlowRunVariable calls api.put', async () => {
    const spy = vi
      .spyOn(api, 'put')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce(undefined as any);
    await expect(
      updateFlowRunVariable('f1', 'name', 123)
    ).resolves.toBeUndefined();
    spy.mockRestore();
  });
});
