import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { commentsListOptions } from '@/domains/comments/queries';
import * as commentsService from '@/domains/comments/service';

describe('comments queries options', () => {
  it('commentsListOptions builds key and calls service', async () => {
    const spy = vi.spyOn(commentsService, 'fetchComments').mockResolvedValueOnce([] as any);
    const opts = commentsListOptions('t1');
    expect(opts.queryKey).toEqual(['comments', 'list', { threadId: 't1' }]);
    await opts.queryFn?.({ client: new QueryClient(), queryKey: opts.queryKey as any, signal: new AbortController().signal, meta: undefined });
    expect(spy).toHaveBeenCalledWith('t1');
    spy.mockRestore();
  });
});


