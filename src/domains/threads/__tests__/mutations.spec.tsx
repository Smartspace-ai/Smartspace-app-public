import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useDeleteThread, useRenameThread, useSetFavorite } from '@/domains/threads/mutations';
import * as service from '@/domains/threads/service';

describe('threads mutations', () => {
  it('useSetFavorite calls service', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const spy = vi.spyOn(service, 'setFavorite').mockResolvedValueOnce(undefined as any);
    const { result } = renderHook(() => useSetFavorite(), { wrapper });
    await result.current.mutateAsync({ threadId: 't1', favorite: true });
    expect(spy).toHaveBeenCalledWith('t1', true);
    spy.mockRestore();
  });

  it('useRenameThread calls service', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const spy = vi.spyOn(service, 'renameThread').mockResolvedValueOnce(undefined as any);
    const { result } = renderHook(() => useRenameThread('t1'), { wrapper });
    await result.current.mutateAsync('New');
    expect(spy).toHaveBeenCalledWith('t1', 'New');
    spy.mockRestore();
  });

  it('useDeleteThread calls service', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const spy = vi.spyOn(service, 'deleteThread').mockResolvedValueOnce(undefined as any);
    const { result } = renderHook(() => useDeleteThread(), { wrapper });
    await result.current.mutateAsync({ threadId: 't1' });
    expect(spy).toHaveBeenCalledWith('t1');
    spy.mockRestore();
  });
});


