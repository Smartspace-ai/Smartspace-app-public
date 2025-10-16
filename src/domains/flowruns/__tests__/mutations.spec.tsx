import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useUpdateFlowRunVariable } from '@/domains/flowruns/mutations';
import { flowRunsKeys } from '@/domains/flowruns/queryKeys';
import * as service from '@/domains/flowruns/service';

describe('flowruns mutations', () => {
  it('useUpdateFlowRunVariable invalidates variables on success', async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const spy = vi.spyOn(service, 'updateFlowRunVariable').mockResolvedValueOnce(undefined as any);
    const { result } = renderHook(() => useUpdateFlowRunVariable(), { wrapper });
    await result.current.mutateAsync({ flowRunId: 'f1', variableName: 'x', value: 1 });
    expect(spy).toHaveBeenCalledWith('f1', 'x', 1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: flowRunsKeys.variables('f1') });
    spy.mockRestore();
  });
});


