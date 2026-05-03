import { renderHook } from '@testing-library/react';
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
import { threadsKeys } from '@/domains/threads/queryKeys';

import {
  buildChatHarness,
  createFakeChatService,
} from '@/test/chatProviderHarness';

describe('messages mutations', () => {
  it('useSendMessage swaps the optimistic entry for the real Message returned by sendMessage', async () => {
    const realMessage = {
      id: 'real-42',
      createdAt: new Date(),
      createdBy: 'Server',
      values: [],
    } as any;
    const sendMessage = vi.fn().mockResolvedValueOnce(realMessage);
    const service = createFakeChatService({ sendMessage });
    const { wrapper, queryClient } = buildChatHarness({ service });

    queryClient.setQueryData(threadsKeys.detail('w', 't'), {
      id: 't',
      isFlowRunning: false,
    } as any);

    const { result } = renderHook(() => useSendMessage(), { wrapper });
    await result.current.mutateAsync({
      workspaceId: 'w',
      threadId: 't',
      contentList: [],
      files: [],
      variables: {},
    });

    const data = queryClient.getQueryData<any[]>(messagesKeys.list('t')) || [];
    expect(data.some((m) => m.optimistic)).toBe(false);
    expect(data.some((m) => m.id === 'real-42')).toBe(true);
    expect(sendMessage).toHaveBeenCalledOnce();

    // Post-POST flip closes the composer indicator gap and opens the SSE
    // gate without waiting for SignalR.
    const detail = queryClient.getQueryData<any>(threadsKeys.detail('w', 't'));
    expect(detail?.isFlowRunning).toBe(true);
  });

  it('useSendMessage does not flip detail.isFlowRunning on POST error', async () => {
    const sendMessage = vi.fn().mockRejectedValueOnce(new Error('boom'));
    const service = createFakeChatService({ sendMessage });
    const { wrapper, queryClient } = buildChatHarness({ service });

    queryClient.setQueryData(threadsKeys.detail('w', 't'), {
      id: 't',
      isFlowRunning: false,
    } as any);

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

    const detail = queryClient.getQueryData<any>(threadsKeys.detail('w', 't'));
    expect(detail?.isFlowRunning).toBe(false);
  });

  it('useSendMessage keeps the thread SSE copy when it already added the real id', async () => {
    const sendMessage = vi.fn().mockResolvedValueOnce({
      id: 'real-42',
      createdAt: new Date(),
      createdBy: 'Server',
      values: [],
    } as any);
    const service = createFakeChatService({ sendMessage });
    const { wrapper, queryClient } = buildChatHarness({ service });

    // Thread SSE snapshot wrote this entry before sendMessage resolved.
    queryClient.setQueryData(messagesKeys.list('t'), [
      {
        id: 'real-42',
        createdAt: new Date(),
        values: [],
        createdBy: 'Server',
      },
    ] as any);

    const { result } = renderHook(() => useSendMessage(), { wrapper });
    await result.current.mutateAsync({
      workspaceId: 'w',
      threadId: 't',
      contentList: [],
      files: [],
      variables: {},
    });

    const data = queryClient.getQueryData<any[]>(messagesKeys.list('t')) || [];
    expect(data.filter((m) => m.id === 'real-42').length).toBe(1);
    expect(data.some((m) => m.optimistic)).toBe(false);
  });

  it('useSendMessage rolls back optimistic on sendMessage error', async () => {
    const sendMessage = vi.fn().mockRejectedValueOnce(new Error('boom'));
    const service = createFakeChatService({ sendMessage });
    const { wrapper, queryClient } = buildChatHarness({ service });

    queryClient.setQueryData(threadsKeys.detail('w', 't'), {
      id: 't',
      isFlowRunning: false,
    } as any);

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

    const data = queryClient.getQueryData<any[]>(messagesKeys.list('t')) || [];
    expect(data.some((m) => m.optimistic)).toBe(false);
    const detail = queryClient.getQueryData<any>(threadsKeys.detail('w', 't'));
    expect(detail?.isFlowRunning).toBe(false);
  });

  it('useAddInputToMessage optimistic patch and reconcile on success', async () => {
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
    const addInputToMessage = vi.fn().mockResolvedValueOnce(returned);
    const service = createFakeChatService({ addInputToMessage });
    const { wrapper, queryClient } = buildChatHarness({ service });

    queryClient.setQueryData(messagesKeys.list('t1'), [
      { id: 'm1', values: [] },
    ] as any);

    const { result } = renderHook(() => useAddInputToMessage(), { wrapper });
    await result.current.addInputToMessageMutation.mutateAsync({
      threadId: 't1',
      messageId: 'm1',
      name: 'x',
      value: 'y',
      channels: {},
    });

    const data = queryClient.getQueryData<any[]>(messagesKeys.list('t1')) || [];
    expect(data[0].values?.length).toBeGreaterThan(0);
    expect(addInputToMessage).toHaveBeenCalledOnce();
  });
});
