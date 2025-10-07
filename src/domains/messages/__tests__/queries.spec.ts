import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { messagesListOptions } from '@/domains/messages/queries';
import * as messagesService from '@/domains/messages/service';

describe('messages queries options', () => {
  it('messagesListOptions builds key and reverses array', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(messagesService, 'fetchMessages').mockResolvedValueOnce([{ id: 'a', createdAt: '', values: [] } as any, { id: 'b', createdAt: '', values: [] } as any]);
    const opts = messagesListOptions('t1');
    expect(opts.queryKey).toEqual(['messages', 'list', { threadId: 't1' }]);
    const result = await opts.queryFn?.({
      client: new QueryClient(),
      queryKey: opts.queryKey as any,
      signal: new AbortController().signal,
      meta: undefined,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(result?.map((m: any) => m.id)).toEqual(['b', 'a']);
    spy.mockRestore();
  });
});


