import { describe, expect, it, vi } from 'vitest';

import { api, } from '@/platform/api';
import { apiParsed } from '@/platform/apiParsed';

import { fetchFlowRunVariables, updateFlowRunVariable } from '@/domains/flowruns/service';

describe('flowruns service', () => {
  it('fetchFlowRunVariables returns mapped record', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed, 'get').mockResolvedValueOnce({ a: 1, b: 'x' } as any);
    const res = await fetchFlowRunVariables('f1');
    expect(res).toMatchObject({ a: 1, b: 'x' });
    spy.mockRestore();
  });

  it('updateFlowRunVariable calls api.put', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(api, 'put').mockResolvedValueOnce(undefined as any);
    await expect(updateFlowRunVariable('f1', 'name', 123)).resolves.toBeUndefined();
    spy.mockRestore();
  });
});


