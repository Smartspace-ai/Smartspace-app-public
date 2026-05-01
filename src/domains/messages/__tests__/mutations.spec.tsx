import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/platform/auth/session', () => ({
  useUserId: () => 'test-user',
  useUserDisplayName: () => 'Test User',
}));

import {
  useAddInputToMessage,
  useSendMessage,
} from '@/domains/messages/mutations';
import { messagesKeys } from '@/domains/messages/queryKeys';
import * as service from '@/domains/messages/service';
import { threadsKeys } from '@/domains/threads/queryKeys';

describe('messages mutations', () => {
  it('useSendMessage swaps the optimistic entry for the real Message returned by postMessage', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    // Seed an existing thread detail so the post-POST isFlowRunning flip
    // has a record to merge into.
    client.setQueryData(threadsKeys.detail('w', 't'), {
      id: 't',
      isFlowRunning: false,
    } as any);

    const realMessage = {
      id: 'real-42',
      createdAt: new Date(),
      createdBy: 'Server',
      values: [],
    } as any;
    const spy = vi
      .spyOn(service, 'postMessage')
      .mockResolvedValueOnce(realMessage);

    const { result } = renderHook(() => useSendMessage(), { wrapper });
    await result.current.mutateAsync({
      workspaceId: 'w',
      threadId: 't',
      contentList: [],
      files: [],
      variables: {},
    });

    const data = client.getQueryData<any[]>(messagesKeys.list('t')) || [];
    expect(data.some((m) => m.optimistic)).toBe(false);
    expect(data.some((m) => m.id === 'real-42')).toBe(true);
    expect(spy).toHaveBeenCalledOnce();

    // Post-POST flip closes the composer indicator gap and opens the SSE
    // gate without waiting for SignalR.
    const detail = client.getQueryData<any>(threadsKeys.detail('w', 't'));
    expect(detail?.isFlowRunning).toBe(true);

    spy.mockRestore();
  });

  it('useSendMessage does not flip detail.isFlowRunning on POST error', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    client.setQueryData(threadsKeys.detail('w', 't'), {
      id: 't',
      isFlowRunning: false,
    } as any);

    const spy = vi
      .spyOn(service, 'postMessage')
      .mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useSendMessage(), { wrapper });
    await expect(
      result.current.mutateAsync({
        workspaceId: 'w',
        threadId: 't',
        contentList: [],
        files: [],
        variables: {},
      })
    ).rejects.toThrow('boom');

    const detail = client.getQueryData<any>(threadsKeys.detail('w', 't'));
    expect(detail?.isFlowRunning).toBe(false);
    spy.mockRestore();
  });

  it('useSendMessage keeps the thread SSE copy when it already added the real id', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    // Thread SSE snapshot wrote this entry before postMessage resolved.
    client.setQueryData(messagesKeys.list('t'), [
      { id: 'real-42', createdAt: new Date(), values: [], createdBy: 'Server' },
    ] as any);

    const spy = vi.spyOn(service, 'postMessage').mockResolvedValueOnce({
      id: 'real-42',
      createdAt: new Date(),
      createdBy: 'Server',
      values: [],
    } as any);

    const { result } = renderHook(() => useSendMessage(), { wrapper });
    await result.current.mutateAsync({
      workspaceId: 'w',
      threadId: 't',
      contentList: [],
      files: [],
      variables: {},
    });

    const data = client.getQueryData<any[]>(messagesKeys.list('t')) || [];
    expect(data.filter((m) => m.id === 'real-42').length).toBe(1);
    expect(data.some((m) => m.optimistic)).toBe(false);
    spy.mockRestore();
  });

  it('useSendMessage rolls back optimistic on postMessage error', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    client.setQueryData(threadsKeys.detail('w', 't'), {
      id: 't',
      isFlowRunning: false,
    } as any);

    const spy = vi
      .spyOn(service, 'postMessage')
      .mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useSendMessage(), { wrapper });
    await expect(
      result.current.mutateAsync({
        workspaceId: 'w',
        threadId: 't',
        contentList: [],
        files: [],
        variables: {},
      })
    ).rejects.toThrow('boom');

    const data = client.getQueryData<any[]>(messagesKeys.list('t')) || [];
    expect(data.some((m) => m.optimistic)).toBe(false);
    const detail = client.getQueryData<any>(threadsKeys.detail('w', 't'));
    expect(detail?.isFlowRunning).toBe(false);
    spy.mockRestore();
  });

  it('useAddInputToMessage optimistic patch and reconcile on success', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    // seed cache with one message
    client.setQueryData(messagesKeys.list('t1'), [
      { id: 'm1', values: [] },
    ] as any);

    const returned = {
      id: 'm1',
      values: [
        {
          id: 'v',
          name: 'x',
          type: 'INPUT',
          value: 'y',
          channels: {},
          createdAt: new Date(),
          createdBy: 'me',
        },
      ],
    } as any;
    const spy = vi
      .spyOn(service, 'addInputToMessage')
      .mockResolvedValueOnce(returned);

    const { result } = renderHook(() => useAddInputToMessage(), { wrapper });
    await result.current.addInputToMessageMutation.mutateAsync({
      threadId: 't1',
      messageId: 'm1',
      name: 'x',
      value: 'y',
      channels: {},
    });

    const data = client.getQueryData<any[]>(messagesKeys.list('t1')) || [];
    expect(data[0].values?.length).toBeGreaterThan(0);
    spy.mockRestore();
  });
});
