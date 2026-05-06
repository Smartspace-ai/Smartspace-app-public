import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderHookWithChat } from '@/test/chatProviderHarness';
import {
  type Message,
  MessageValueType,
  messagesKeys,
  useSendMessage,
} from '@smartspace/chat-ui';

const baseMessage = (over: Partial<Message> = {}): Message => ({
  id: 'm-base',
  values: [
    {
      id: 'v-base',
      type: MessageValueType.INPUT,
      name: 'prompt',
      value: 'baseline',
      channels: {},
      createdAt: new Date('2024-01-01T00:00:00Z'),
      createdBy: 'Server',
      createdByUserId: 'u1',
    },
  ],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: 'Server',
  createdByUserId: 'u1',
  ...over,
});

describe('useSendMessage merge-in-place reconciliation', () => {
  it('drops the optimistic and appends realMessage when not already present', async () => {
    const realMessage = baseMessage({ id: 'real-1' });
    const sendMessage = vi.fn().mockResolvedValueOnce(realMessage);
    const { result, queryClient } = renderHookWithChat(() => useSendMessage(), {
      threadId: 't1',
      service: {
        sendMessage,
      } as Parameters<typeof renderHookWithChat>[1] extends infer O
        ? O extends { service?: infer S }
          ? S
          : never
        : never,
    });

    // Seed historical messages so we can verify they're preserved.
    const m1 = baseMessage({ id: 'm1' });
    const m2 = baseMessage({ id: 'm2' });
    queryClient.setQueryData<Message[]>(messagesKeys.list('t1'), [m1, m2]);

    await act(async () => {
      await result.current.mutateAsync({
        workspaceId: 'w1',
        threadId: 't1',
        contentList: [{ text: 'hi', image: undefined }],
      });
    });

    const after =
      queryClient.getQueryData<Message[]>(messagesKeys.list('t1')) ?? [];
    expect(after.map((m) => m.id)).toEqual(['m1', 'm2', 'real-1']);
    expect(after.some((m) => m.optimistic)).toBe(false);
  });

  it('keeps the existing entry when the SSE has already delivered realMessage', async () => {
    // The SSE could open early (SignalR-triggered) and deliver `realMessage`
    // with richer state — in-progress AI output, fresher fields — before this
    // mutation's onSuccess runs. The default `keep-existing` strategy must
    // not clobber that with the sparse POST response.
    const richIncoming = baseMessage({
      id: 'real-1',
      values: [
        ...baseMessage().values!,
        {
          id: 'ai-out-1',
          type: MessageValueType.OUTPUT,
          name: 'response',
          value: 'AI streaming...',
          channels: {},
          createdAt: new Date('2024-01-01T00:00:01Z'),
          createdBy: 'bot',
          createdByUserId: 'bot',
        },
      ],
    });
    const sparseFromPost = baseMessage({ id: 'real-1' }); // inputs only
    const sendMessage = vi.fn().mockResolvedValueOnce(sparseFromPost);
    const { result, queryClient } = renderHookWithChat(() => useSendMessage(), {
      threadId: 't1',
      service: { sendMessage } as never,
    });

    queryClient.setQueryData<Message[]>(messagesKeys.list('t1'), [
      richIncoming,
    ]);

    await act(async () => {
      await result.current.mutateAsync({
        workspaceId: 'w1',
        threadId: 't1',
        contentList: [{ text: 'hi', image: undefined }],
      });
    });

    const after =
      queryClient.getQueryData<Message[]>(messagesKeys.list('t1')) ?? [];
    expect(after).toHaveLength(1);
    // The richer SSE-delivered version is preserved (still has 2 values).
    expect(after[0].values?.length).toBe(2);
  });

  it('rolls back the optimistic when sendMessage rejects', async () => {
    const sendMessage = vi.fn().mockRejectedValueOnce(new Error('boom'));
    const { result, queryClient } = renderHookWithChat(() => useSendMessage(), {
      threadId: 't1',
      service: { sendMessage } as never,
    });

    const m1 = baseMessage({ id: 'm1' });
    queryClient.setQueryData<Message[]>(messagesKeys.list('t1'), [m1]);

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          workspaceId: 'w1',
          threadId: 't1',
          contentList: [{ text: 'hi', image: undefined }],
        })
      ).rejects.toThrow('boom');
    });

    const after =
      queryClient.getQueryData<Message[]>(messagesKeys.list('t1')) ?? [];
    expect(after.map((m) => m.id)).toEqual(['m1']);
    expect(after.some((m) => m.optimistic)).toBe(false);
  });
});
