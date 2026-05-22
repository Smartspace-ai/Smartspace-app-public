import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearPendingThreadUsers,
  getPendingThreadUsers,
  setPendingThreadUsers,
} from '@/domains/thread-users/pendingThreadUsers';
import * as service from '@/domains/thread-users/service';
import { useDrainPendingThreadUsersOnSend } from '@/domains/thread-users/useDrainPendingThreadUsersOnSend';

type SendVars = {
  workspaceId: string;
  threadId: string;
  contentList: unknown[];
};
type OtherVars = { unrelated: string };

function makeWrapper(client: QueryClient) {
  const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return wrapper;
}

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

afterEach(() => {
  clearPendingThreadUsers('t1');
  vi.restoreAllMocks();
});

describe('useDrainPendingThreadUsersOnSend', () => {
  it('does nothing when there are no pending users for the thread', async () => {
    const client = makeClient();
    const addSpy = vi
      .spyOn(service, 'addThreadUser')
      .mockResolvedValue(undefined);

    const { result } = renderHook(
      () => ({
        drain: useDrainPendingThreadUsersOnSend(),
        send: useMutation<void, Error, SendVars>({
          mutationFn: async () => undefined,
        }),
      }),
      { wrapper: makeWrapper(client) }
    );

    await act(() =>
      result.current.send.mutateAsync({
        workspaceId: 'w1',
        threadId: 't1',
        contentList: [],
      })
    );

    expect(addSpy).not.toHaveBeenCalled();
  });

  it('calls addThreadUser for each pending user when a send mutation succeeds', async () => {
    const client = makeClient();
    const addSpy = vi
      .spyOn(service, 'addThreadUser')
      .mockResolvedValue(undefined);

    setPendingThreadUsers('t1', ['u1', 'u2']);

    const { result } = renderHook(
      () => ({
        drain: useDrainPendingThreadUsersOnSend(),
        send: useMutation<void, Error, SendVars>({
          mutationFn: async () => undefined,
        }),
      }),
      { wrapper: makeWrapper(client) }
    );

    await act(() =>
      result.current.send.mutateAsync({
        workspaceId: 'w1',
        threadId: 't1',
        contentList: [],
      })
    );

    await waitFor(() => expect(addSpy).toHaveBeenCalledTimes(2));
    expect(addSpy).toHaveBeenCalledWith('t1', 'u1');
    expect(addSpy).toHaveBeenCalledWith('t1', 'u2');
  });

  it('clears pending state before draining so a second send does not re-add', async () => {
    const client = makeClient();
    vi.spyOn(service, 'addThreadUser').mockResolvedValue(undefined);

    setPendingThreadUsers('t1', ['u1']);

    const { result } = renderHook(
      () => ({
        drain: useDrainPendingThreadUsersOnSend(),
        send: useMutation<void, Error, SendVars>({
          mutationFn: async () => undefined,
        }),
      }),
      { wrapper: makeWrapper(client) }
    );

    await act(() =>
      result.current.send.mutateAsync({
        workspaceId: 'w1',
        threadId: 't1',
        contentList: [],
      })
    );

    await waitFor(() => expect(getPendingThreadUsers('t1')).toHaveLength(0));
  });

  it('does not drain when the mutation variables do not match the send shape', async () => {
    const client = makeClient();
    const addSpy = vi
      .spyOn(service, 'addThreadUser')
      .mockResolvedValue(undefined);

    setPendingThreadUsers('t1', ['u1']);

    const { result } = renderHook(
      () => ({
        drain: useDrainPendingThreadUsersOnSend(),
        // Variables missing 'contentList' — does not match isSendMessageVariables
        other: useMutation<void, Error, OtherVars>({
          mutationFn: async () => undefined,
        }),
      }),
      { wrapper: makeWrapper(client) }
    );

    await act(() => result.current.other.mutateAsync({ unrelated: 'value' }));

    expect(addSpy).not.toHaveBeenCalled();
  });

  it('logs an error and does not throw when addThreadUser fails', async () => {
    const client = makeClient();
    vi.spyOn(service, 'addThreadUser').mockRejectedValue(
      new Error('server down')
    );
    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    setPendingThreadUsers('t1', ['u1']);

    const { result } = renderHook(
      () => ({
        drain: useDrainPendingThreadUsersOnSend(),
        send: useMutation<void, Error, SendVars>({
          mutationFn: async () => undefined,
        }),
      }),
      { wrapper: makeWrapper(client) }
    );

    await act(() =>
      result.current.send.mutateAsync({
        workspaceId: 'w1',
        threadId: 't1',
        contentList: [],
      })
    );

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to add pending thread user',
        'u1',
        expect.any(Error)
      )
    );
  });
});
