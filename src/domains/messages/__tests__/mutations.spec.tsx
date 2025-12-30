import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/platform/auth/session', () => ({
  useUserId: () => 'test-user',
  useUserDisplayName: () => 'Test User',
}));

import { useAddInputToMessage, useSendMessage } from '@/domains/messages/mutations';
import { messagesKeys } from '@/domains/messages/queryKeys';
import * as service from '@/domains/messages/service';

describe('messages mutations', () => {
  it('useSendMessage writes optimistic and subscribes to subject', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const subject = { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) } as any;
    const spy = vi.spyOn(service, 'postMessage').mockResolvedValueOnce(subject);

    const { result } = renderHook(() => useSendMessage(), { wrapper });
    await result.current.mutateAsync({ workspaceId: 'w', threadId: 't', contentList: [], files: [], variables: {} });
    const data = client.getQueryData<any[]>(messagesKeys.list('t')) || [];
    expect(data.some((m) => m.optimistic)).toBe(true);
    expect(subject.subscribe).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('useAddInputToMessage optimistic patch and reconcile on success', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    // seed cache with one message
    client.setQueryData(messagesKeys.list('t1'), [{ id: 'm1', values: [] }] as any);

    const returned = { id: 'm1', values: [{ id: 'v', name: 'x', type: 'INPUT', value: 'y', channels: {}, createdAt: new Date(), createdBy: 'me' }] } as any;
    const spy = vi.spyOn(service, 'addInputToMessage').mockResolvedValueOnce(returned);

    const { result } = renderHook(() => useAddInputToMessage(), { wrapper });
    await result.current.addInputToMessageMutation.mutateAsync({ threadId: 't1', messageId: 'm1', name: 'x', value: 'y', channels: {} });

    const data = client.getQueryData<any[]>(messagesKeys.list('t1')) || [];
    expect(data[0].values?.length).toBeGreaterThan(0);
    spy.mockRestore();
  });
});


