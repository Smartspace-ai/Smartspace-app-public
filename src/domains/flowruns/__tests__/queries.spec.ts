import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { flowRunVariablesOptions } from '@/domains/flowruns/queries';
import * as flowrunsService from '@/domains/flowruns/service';

describe('flowruns queries options', () => {
  it('flowRunVariablesOptions builds key and calls service', async () => {
    const spy = vi.spyOn(flowrunsService, 'fetchFlowRunVariables').mockResolvedValueOnce({} as any);
    const opts = flowRunVariablesOptions('f1');
    expect(opts.queryKey).toEqual(['flowruns', 'variables', { flowRunId: 'f1' }]);
    await opts.queryFn?.({ client: new QueryClient(), queryKey: opts.queryKey as any, signal: new AbortController().signal, meta: undefined });
    expect(spy).toHaveBeenCalledWith('f1');
    spy.mockRestore();
  });
});


