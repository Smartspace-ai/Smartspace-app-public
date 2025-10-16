import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useMarkAllAsRead, useMarkAsRead } from '@/domains/notifications/mutations';
import { notificationsKeys } from '@/domains/notifications/queryKeys';
import * as service from '@/domains/notifications/service';

describe('notifications mutations', () => {
  it('useMarkAsRead invalidates queries', async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const spy = vi.spyOn(service, 'markNotificationAsRead').mockResolvedValueOnce(undefined as any);
    const { result } = renderHook(() => useMarkAsRead(), { wrapper });
    await result.current.mutateAsync('n1');
    expect(spy).toHaveBeenCalledWith('n1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationsKeys.all });
    spy.mockRestore();
  });

  it('useMarkAllAsRead invalidates queries', async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const spy = vi.spyOn(service, 'markAllNotificationsAsRead').mockResolvedValueOnce(undefined as any);
    const { result } = renderHook(() => useMarkAllAsRead(), { wrapper });
    await result.current.mutateAsync();
    expect(spy).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationsKeys.all });
    spy.mockRestore();
  });
});


