import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { applyCommentToCache } from '@/domains/comments/cache';
import type { Comment } from '@/domains/comments/model';
import { commentsKeys } from '@/domains/comments/queryKeys';

const summary = (
  over: Partial<{ id: string; createdAt: string; content: string }> = {}
) => ({
  id: over.id ?? 'c1',
  messageThreadId: 't1',
  createdAt: over.createdAt ?? '2024-01-01T00:00:00Z',
  createdByUserId: 'u1',
  createdBy: 'User',
  content: over.content ?? 'hello',
  mentionedUsers: [],
});

describe('applyCommentToCache', () => {
  it('writes to commentsKeys.list(threadId) — not the legacy ["comments", threadId] key', () => {
    const qc = new QueryClient();
    qc.setQueryData<Comment[]>(commentsKeys.list('t1'), []);

    const applied = applyCommentToCache(qc, summary());

    expect(applied).toBe(true);
    const listed = qc.getQueryData<Comment[]>(commentsKeys.list('t1'));
    expect(listed?.length).toBe(1);
    expect(listed?.[0].id).toBe('c1');

    // The previously-broken handler targeted this key, which was never the
    // real cache key. Asserting it stays empty guards against a regression
    // back to that shape.
    expect(qc.getQueryData(['comments', 't1'])).toBeUndefined();
  });

  it('returns false when no list cache exists yet (caller falls back to invalidate)', () => {
    const qc = new QueryClient();
    expect(applyCommentToCache(qc, summary())).toBe(false);
  });

  it('replaces by id when the comment already exists', () => {
    const qc = new QueryClient();
    qc.setQueryData<Comment[]>(commentsKeys.list('t1'), [
      {
        id: 'c1',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        createdBy: 'User',
        createdByUserId: 'u1',
        content: 'old',
        mentionedUsers: [],
        messageThreadId: 't1',
      },
    ]);

    applyCommentToCache(qc, summary({ content: 'edited' }));

    const listed = qc.getQueryData<Comment[]>(commentsKeys.list('t1')) ?? [];
    expect(listed.length).toBe(1);
    expect(listed[0].content).toBe('edited');
  });

  it('appends and sorts ascending by createdAt for new comments', () => {
    const qc = new QueryClient();
    qc.setQueryData<Comment[]>(commentsKeys.list('t1'), [
      {
        id: 'c1',
        createdAt: new Date('2024-01-01T00:00:01Z'),
        createdBy: 'User',
        createdByUserId: 'u1',
        content: 'first',
        mentionedUsers: [],
        messageThreadId: 't1',
      },
    ]);

    applyCommentToCache(
      qc,
      summary({
        id: 'c0',
        createdAt: '2024-01-01T00:00:00Z',
        content: 'earlier',
      })
    );

    const listed = qc.getQueryData<Comment[]>(commentsKeys.list('t1')) ?? [];
    expect(listed.map((c) => c.id)).toEqual(['c0', 'c1']);
  });
});
