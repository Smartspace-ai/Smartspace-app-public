import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderHookWithChat } from '@/test/chatProviderHarness';
import {
  type Message,
  MessageValueType,
  messagesKeys,
  useAddInputToMessage,
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

describe('useAddInputToMessage', () => {
  it('applies an optimistic value patch and replaces it with the server response on success', async () => {
    // The server returns the full updated message including the new value.
    const serverMessage = baseMessage({
      id: 'msg-1',
      values: [
        ...baseMessage().values!,
        {
          id: 'server-val-1',
          type: MessageValueType.INPUT,
          name: 'rating',
          value: 5,
          channels: {},
          createdAt: new Date('2024-01-01T00:01:00Z'),
          createdBy: 'Test User',
          createdByUserId: 'test-user',
        },
      ],
    });
    const addInputToMessage = vi.fn().mockResolvedValueOnce(serverMessage);
    const { result, queryClient } = renderHookWithChat(
      () => useAddInputToMessage(),
      {
        threadId: 't1',
        service: { addInputToMessage } as never,
      }
    );

    // Seed the cache with the target message (no optimistic values yet).
    const seed = baseMessage({ id: 'msg-1' });
    queryClient.setQueryData<Message[]>(messagesKeys.list('t1'), [seed]);

    await act(async () => {
      await result.current.addInputToMessageMutation.mutateAsync({
        threadId: 't1',
        messageId: 'msg-1',
        name: 'rating',
        value: 5,
        channels: null,
      });
    });

    const after =
      queryClient.getQueryData<Message[]>(messagesKeys.list('t1')) ?? [];
    // Only the one message remains.
    expect(after).toHaveLength(1);
    // The server response has been committed — no temp- prefixed value IDs.
    const valueIds = after[0].values?.map((v) => v.id) ?? [];
    expect(valueIds.some((id) => id.startsWith('temp-'))).toBe(false);
    // The server value is present.
    expect(valueIds).toContain('server-val-1');
  });

  it('rolls back the optimistic patch when the service call fails', async () => {
    const addInputToMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error('server error'));
    const { result, queryClient } = renderHookWithChat(
      () => useAddInputToMessage(),
      {
        threadId: 't1',
        service: { addInputToMessage } as never,
      }
    );

    // Seed with a plain server message (no optimistic flag — this is the real
    // production path; the patched message is never marked optimistic: true).
    const plain = baseMessage({ id: 'msg-1' });
    const plain2 = baseMessage({ id: 'msg-2' });
    queryClient.setQueryData<Message[]>(messagesKeys.list('t1'), [
      plain,
      plain2,
    ]);

    await act(async () => {
      await expect(
        result.current.addInputToMessageMutation.mutateAsync({
          threadId: 't1',
          messageId: 'msg-1',
          name: 'rating',
          value: 5,
          channels: null,
        })
      ).rejects.toThrow('server error');
    });

    const after =
      queryClient.getQueryData<Message[]>(messagesKeys.list('t1')) ?? [];
    // onError restores the pre-mutation snapshot — both plain messages survive.
    expect(after.map((m) => m.id)).toEqual(['msg-1', 'msg-2']);
    // No temp- values remain on the target message.
    const targetMsg = after.find((m) => m.id === 'msg-1');
    expect(
      targetMsg?.values?.some((v) => v.id.startsWith('temp-'))
    ).toBe(false);
  });

  it('two rapid calls produce different IDs, neither matching a timestamp-only format', async () => {
    // Collect the temp IDs injected by two back-to-back mutationFn calls.
    const capturedTempIds: string[] = [];

    // Use an addInputToMessage stub that resolves but lets us inspect the
    // optimistic patch that was applied just before the await.
    const addInputToMessage = vi
      .fn()
      .mockImplementation(async () => baseMessage({ id: 'msg-1' }));

    const { result, queryClient } = renderHookWithChat(
      () => useAddInputToMessage(),
      {
        threadId: 't1',
        service: { addInputToMessage } as never,
      }
    );

    // Intercept cache writes so we can capture the temp IDs.
    const originalSetQueryData = queryClient.setQueryData.bind(queryClient);
    vi.spyOn(queryClient, 'setQueryData').mockImplementation(
      (key, updater, ...rest) => {
        const result = originalSetQueryData(key, updater, ...rest);
        const data = queryClient.getQueryData<Message[]>(
          messagesKeys.list('t1')
        );
        if (data) {
          for (const msg of data) {
            for (const val of msg.values ?? []) {
              if (
                val.id.startsWith('temp-') &&
                !capturedTempIds.includes(val.id)
              ) {
                capturedTempIds.push(val.id);
              }
            }
          }
        }
        return result;
      }
    );

    const seedMsg = baseMessage({ id: 'msg-1' });
    queryClient.setQueryData<Message[]>(messagesKeys.list('t1'), [seedMsg]);

    await act(async () => {
      await Promise.all([
        result.current.addInputToMessageMutation.mutateAsync({
          threadId: 't1',
          messageId: 'msg-1',
          name: 'rating',
          value: 1,
          channels: null,
        }),
        result.current.addInputToMessageMutation.mutateAsync({
          threadId: 't1',
          messageId: 'msg-1',
          name: 'rating',
          value: 2,
          channels: null,
        }),
      ]);
    });

    // At least two distinct temp IDs were produced.
    const uniqueIds = [...new Set(capturedTempIds)];
    expect(uniqueIds.length).toBeGreaterThanOrEqual(2);

    // No ID should be a pure timestamp (the timestamp-only fallback would be
    // all digits, possibly with a hyphen-separated random suffix — a UUID
    // from the real API has four hyphens in fixed positions).
    // We assert that every ID either matches a UUID v4 pattern or contains
    // enough entropy to not be a bare timestamp.
    const pureTimestampPattern = /^\d+$/;
    for (const id of uniqueIds) {
      // Strip the leading "temp-" prefix before inspecting the UUID portion.
      const uuid = id.replace(/^temp-/, '').replace(/-add$/, '');
      expect(pureTimestampPattern.test(uuid)).toBe(false);
    }
  });
});
