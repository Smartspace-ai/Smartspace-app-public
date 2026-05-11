import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useAddComment } from '@/domains/comments/mutations';
import { commentsKeys } from '@/domains/comments/queryKeys';
import * as service from '@/domains/comments/service';

vi.mock('@/platform/auth/session', () => ({
  useUserId: () => 'me-id',
  useUserDisplayName: () => 'Me',
}));

describe('comments mutations', () => {
  it('useAddComment adds optimistic then replaces with real', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const real = {
      id: 'c-real',
      content: 'hello',
      createdAt: new Date('2024-01-01'),
      createdBy: 'me-id',
      createdByUserId: 'me-id',
      mentionedUsers: [],
      messageThreadId: 't1',
    } as any;
    const spy = vi.spyOn(service, 'addComment').mockResolvedValueOnce(real);

    const { result } = renderHook(() => useAddComment('t1'), { wrapper });
    await result.current.mutateAsync({
      threadId: 't1',
      content: 'hello',
      mentionedUsers: [],
    });

    const data = client.getQueryData<any[]>(commentsKeys.list('t1')) || [];
    expect(data.find((x) => x.id === 'c-real')).toBeTruthy();
    expect(data.find((x) => String(x.id).startsWith('temp-'))).toBeFalsy();
    spy.mockRestore();
  });

  it('useAddComment does not duplicate when SignalR push lands before the POST resolves', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const real = {
      id: 'c-real',
      content: 'hello',
      createdAt: new Date('2024-01-01'),
      createdBy: 'me-id',
      createdByUserId: 'me-id',
      mentionedUsers: [],
      messageThreadId: 't1',
    } as any;

    // Simulate the race: SignalR pushes the real comment into the cache while
    // the POST is still in flight. Resolve the mutation only after we have
    // injected the real comment alongside the optimistic placeholder.
    let resolvePost: (value: any) => void = () => undefined;
    const postPromise = new Promise((r) => {
      resolvePost = r;
    });
    const spy = vi
      .spyOn(service, 'addComment')
      .mockImplementationOnce(() => postPromise as any);

    const { result } = renderHook(() => useAddComment('t1'), { wrapper });
    const pending = result.current.mutateAsync({
      threadId: 't1',
      content: 'hello',
      mentionedUsers: [],
    });

    // Wait for onMutate to settle (it awaits cancelQueries) and the optimistic placeholder to land.
    await waitFor(() => {
      const list = client.getQueryData<any[]>(commentsKeys.list('t1')) || [];
      expect(list.length).toBe(1);
      expect(String(list[0].id).startsWith('temp-')).toBe(true);
    });

    // SignalR appends the real comment alongside the placeholder.
    client.setQueryData(commentsKeys.list('t1'), (old: any[] | undefined) => [
      ...(old ?? []),
      real,
    ]);

    // Now let the POST resolve.
    resolvePost(real);
    await pending;

    const data = client.getQueryData<any[]>(commentsKeys.list('t1')) || [];
    expect(data.filter((x) => x.id === 'c-real').length).toBe(1);
    expect(data.find((x) => String(x.id).startsWith('temp-'))).toBeFalsy();
    spy.mockRestore();
  });
});
