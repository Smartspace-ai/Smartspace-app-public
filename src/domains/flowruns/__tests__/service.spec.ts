import { describe, expect, it, vi } from 'vitest';

import { api } from '@/platform/api';
import { apiMutator } from '@/platform/api/orvalMutator';

import {
  fetchFlowRunVariables,
  updateFlowRunVariable,
} from '@/domains/flowruns/service';

vi.mock('@/platform/api/orvalMutator', () => ({
  apiMutator: vi.fn(),
}));
vi.mock('@/platform/validation', () => ({
  parseOrThrow: vi.fn((_schema: unknown, data: unknown) => data),
}));

const mockedMutator = vi.mocked(apiMutator);

describe('flowruns service', () => {
  it('fetchFlowRunVariables returns mapped record', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedMutator.mockResolvedValueOnce({ data: { a: 1, b: 'x' } } as any);
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
