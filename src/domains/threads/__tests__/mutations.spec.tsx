import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  useDeleteThread,
  useRenameThread,
  useSetPin,
} from '@/domains/threads/mutations';
import * as service from '@/domains/threads/service';

import { messagesKeys } from '@smartspace/chat-ui';

describe('threads mutations', () => {
  it('useSetPin calls service', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const spy = vi
      .spyOn(service, 'setPin')
      .mockResolvedValueOnce(undefined as any);
    const { result } = renderHook(() => useSetPin(), { wrapper });
    await result.current.mutateAsync({ threadId: 't1', pin: true });
    expect(spy).toHaveBeenCalledWith('t1', true);
    spy.mockRestore();
  });

  it('useRenameThread calls service', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const spy = vi
      .spyOn(service, 'renameThread')
      .mockResolvedValueOnce(undefined as any);
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
    const spy = vi
      .spyOn(service, 'deleteThread')
      .mockResolvedValueOnce(undefined as any);
    const { result } = renderHook(() => useDeleteThread(), { wrapper });
    await result.current.mutateAsync({ threadId: 't1' });
    expect(spy).toHaveBeenCalledWith('t1');
    spy.mockRestore();
  });

  it('useDeleteThread drops the deleted thread messages cache', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    client.setQueryData(messagesKeys.list('t1'), [{ id: 'm1' }]);
    client.setQueryData(messagesKeys.infinite('t1'), {
      pages: [],
      pageParams: [],
    });

    const spy = vi
      .spyOn(service, 'deleteThread')
      .mockResolvedValueOnce(undefined as any);
    const { result } = renderHook(() => useDeleteThread(), { wrapper });
    await result.current.mutateAsync({ threadId: 't1' });

    // A stale messages cache would repaint the deleted thread if its id ever
    // flows back into the URL (e.g. the browser Back button).
    expect(client.getQueryData(messagesKeys.list('t1'))).toBeUndefined();
    expect(client.getQueryData(messagesKeys.infinite('t1'))).toBeUndefined();
    spy.mockRestore();
  });
});
