import { renderHook } from '@testing-library/react';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import {
  useAddInputToMessage,
  useSendMessage,
} from '@/domains/messages/mutations';
import { messagesKeys } from '@/domains/messages/queryKeys';

import {
  buildChatHarness,
  createFakeChatService,
} from '@/test/chatProviderHarness';

describe('messages mutations', () => {
  it('useSendMessage writes optimistic and subscribes to subject', async () => {
    const subject = new Subject<any>();
    const subscribe = vi.spyOn(subject, 'subscribe');
    const service = createFakeChatService({
      sendMessage: () => subject,
    });
    const { wrapper, queryClient } = buildChatHarness({ service });

    const { result } = renderHook(() => useSendMessage(), { wrapper });
    await result.current.mutateAsync({
      workspaceId: 'w',
      threadId: 't',
      contentList: [],
      files: [],
      variables: {},
    });

    const data = queryClient.getQueryData<any[]>(messagesKeys.list('t')) || [];
    expect(data.some((m) => m.optimistic)).toBe(true);
    expect(subscribe).toHaveBeenCalled();
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
    const service = createFakeChatService({
      addInputToMessage: async () => returned,
    });
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
  });
});
