import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { threadDetailOptions } from '@/domains/threads/queries';

import { createFakeChatService } from '@/test/chatProviderHarness';

describe('threadDetailOptions', () => {
  it('composes the detail key from workspaceId+threadId and calls the injected service', async () => {
    const fetchThread = vi.fn().mockResolvedValueOnce({ id: 't1' });
    const service = createFakeChatService({ fetchThread });
    const opts = threadDetailOptions({
      service,
      workspaceId: 'w1',
      threadId: 't1',
    });

    expect(opts.queryKey).toEqual([
      'threads',
      'detail',
      { workspaceId: 'w1', threadId: 't1' },
    ]);

    await opts.queryFn?.({
      client: new QueryClient(),
      queryKey: opts.queryKey as never,
      signal: new AbortController().signal,
      meta: undefined,
    });

    expect(fetchThread).toHaveBeenCalledWith('w1', 't1');
  });
});
