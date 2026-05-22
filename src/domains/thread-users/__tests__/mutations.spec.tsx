import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { ThreadUser } from '@/domains/thread-users/model';
import { useAddThreadUser } from '@/domains/thread-users/mutations';
import { threadUsersKeys } from '@/domains/thread-users/queryKeys';
import * as service from '@/domains/thread-users/service';

import { makeThreadUser } from '@/test/factories';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, client };
}

describe('useAddThreadUser', () => {
  it('optimistically adds the user to the cache before the request settles', async () => {
    const { wrapper, client } = makeWrapper();
    const spy = vi
      .spyOn(service, 'addThreadUser')
      .mockResolvedValueOnce(undefined);

    const existing = makeThreadUser({ userId: 'existing-user' });
    client.setQueryData<ThreadUser[]>(threadUsersKeys.list('t1'), [existing]);

    const { result } = renderHook(() => useAddThreadUser('t1'), { wrapper });
    await result.current.mutateAsync({
      userId: 'new-user',
      user: { displayName: 'New User' },
    });

    const after =
      client.getQueryData<ThreadUser[]>(threadUsersKeys.list('t1')) ?? [];
    expect(after.some((u) => u.userId === 'new-user')).toBe(true);
    expect(after.some((u) => u.userId === 'existing-user')).toBe(true);
    spy.mockRestore();
  });

  it('does not add a duplicate if the user is already in the list', async () => {
    const { wrapper, client } = makeWrapper();
    const spy = vi
      .spyOn(service, 'addThreadUser')
      .mockResolvedValueOnce(undefined);

    const user = makeThreadUser({ userId: 'already-here' });
    client.setQueryData<ThreadUser[]>(threadUsersKeys.list('t1'), [user]);

    const { result } = renderHook(() => useAddThreadUser('t1'), { wrapper });
    await result.current.mutateAsync({ userId: 'already-here' });

    const after =
      client.getQueryData<ThreadUser[]>(threadUsersKeys.list('t1')) ?? [];
    expect(after.filter((u) => u.userId === 'already-here')).toHaveLength(1);
    spy.mockRestore();
  });

  it('rolls back the optimistic entry when the service call fails', async () => {
    const { wrapper, client } = makeWrapper();
    const spy = vi
      .spyOn(service, 'addThreadUser')
      .mockRejectedValueOnce(new Error('network error'));

    const existing = makeThreadUser({ userId: 'existing-user' });
    client.setQueryData<ThreadUser[]>(threadUsersKeys.list('t1'), [existing]);

    const { result } = renderHook(() => useAddThreadUser('t1'), { wrapper });
    await expect(
      result.current.mutateAsync({ userId: 'new-user' })
    ).rejects.toThrow('network error');

    const after =
      client.getQueryData<ThreadUser[]>(threadUsersKeys.list('t1')) ?? [];
    expect(after.some((u) => u.userId === 'new-user')).toBe(false);
    expect(after.some((u) => u.userId === 'existing-user')).toBe(true);
    spy.mockRestore();
  });

  it('throws when threadId is null and mutation is called', async () => {
    const { wrapper } = makeWrapper();
    const spy = vi
      .spyOn(service, 'addThreadUser')
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAddThreadUser(null), { wrapper });
    await expect(result.current.mutateAsync({ userId: 'u1' })).rejects.toThrow(
      'Thread ID is required'
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
