import { describe, expect, it, vi } from 'vitest';

import { apiParsed } from '@/platform/apiParsed';

import { addComment, fetchComments } from '@/domains/comments/service';

describe('comments service', () => {
  it('fetchComments returns sorted mapped list', async () => {
    const c1 = { id: '1', createdAt: '2024-01-01T00:00:00Z', createdByUserId: 'u', createdBy: 'U', content: 'a', mentionedUsers: [], messageThreadId: 't' };
    const c2 = { id: '2', createdAt: '2024-01-02T00:00:00Z', createdByUserId: 'u', createdBy: 'U', content: 'b', mentionedUsers: [], messageThreadId: 't' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed, 'get').mockResolvedValueOnce({ data: [c2, c1] } as any);
    const res = await fetchComments('t');
    expect(res.map(x => x.id)).toEqual(['1', '2']);
    spy.mockRestore();
  });

  it('addComment posts and maps result', async () => {
    const dto = { id: '3', createdAt: '2024-01-03', createdByUserId: 'u', createdBy: 'U', content: 'c', mentionedUsers: [], messageThreadId: 't' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed, 'post').mockResolvedValueOnce(dto as any);
    const res = await addComment('t', 'c', []);
    expect(res.id).toBe('3');
    expect(res.messageThreadId).toBe('t');
    spy.mockRestore();
  });
});


