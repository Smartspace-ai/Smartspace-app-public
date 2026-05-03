import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { messagesListOptions } from '@/domains/messages/queries';

import { createFakeChatService } from '@/test/chatProviderHarness';

describe('messages queries options', () => {
  it('messagesListOptions builds key and reverses array', async () => {
    const fetchMessages = vi.fn().mockResolvedValueOnce([
      { id: 'a', createdAt: new Date('2024-01-01T00:00:00Z'), values: [] },
      { id: 'b', createdAt: new Date('2024-01-02T00:00:00Z'), values: [] },
    ]);
    const service = createFakeChatService({ fetchMessages });
    const opts = messagesListOptions(service, 't1');
    expect(opts.queryKey).toEqual(['messages', 'list', { threadId: 't1' }]);
    const result = await opts.queryFn?.({
      client: new QueryClient(),
      queryKey: opts.queryKey as any,
      signal: new AbortController().signal,
      meta: undefined,
    });
    expect(result?.map((m: any) => m.id)).toEqual(['b', 'a']);
    expect(fetchMessages).toHaveBeenCalledWith('t1', undefined);
  });
});
