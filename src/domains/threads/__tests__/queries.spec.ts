import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import type { MessageThread, ThreadsResponse } from '@/domains/threads';
import * as threads from '@/domains/threads';
import { threadDetailOptions, threadsListOptions } from '@/domains/threads/queries';

describe('threads queries options', () => {
  it('threadsListOptions uses correct key and fn', async () => {
    const spy = vi.spyOn(threads, 'fetchThreads').mockResolvedValueOnce({ data: [], total: 0 } as ThreadsResponse);
    const opts = threadsListOptions('w1');
    expect(opts.queryKey).toEqual(['threads', 'list', { workspaceId: 'w1' }]);
    await opts.queryFn?.({
      client: new QueryClient(),
      queryKey: opts.queryKey as any,
      signal: new AbortController().signal,
      meta: undefined,
    });
    expect(spy).toHaveBeenCalledWith('w1');
    spy.mockRestore();
  });

  it('threadDetailOptions uses correct key and fn', async () => {
    const spy = vi.spyOn(threads, 'fetchThread').mockResolvedValueOnce({
      id: 't1', createdAt: '', createdBy: '', createdByUserId: '', isFlowRunning: false, lastUpdated: '', lastUpdatedAt: '', lastUpdatedByUserId: '', name: '', totalMessages: 0,
    } as MessageThread);
    const opts = threadDetailOptions({ workspaceId: 'w1', threadId: 't1' });
    expect(opts.queryKey).toEqual(['threads', 'detail', { workspaceId: 'w1', threadId: 't1' }]);
    await opts.queryFn?.({
      client: new QueryClient(),
      queryKey: opts.queryKey as any,
      signal: new AbortController().signal,
      meta: undefined,
    });
    expect(spy).toHaveBeenCalledWith('w1', 't1');
    spy.mockRestore();
  });
});


