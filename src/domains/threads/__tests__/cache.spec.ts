import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
  applyThreadToCache,
  setThreadRunningInLists,
} from '@/domains/threads/cache';
import type { MessageThread, ThreadsResponse } from '@/domains/threads/model';
import { threadsKeys } from '@/domains/threads/queryKeys';

const thread = (over: Partial<MessageThread> = {}): MessageThread => ({
  id: 't1',
  workSpaceId: 'w1',
  name: 'Thread',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: 'User',
  createdByUserId: 'u1',
  isFlowRunning: false,
  lastUpdatedAt: new Date('2024-01-01T00:00:00Z'),
  lastUpdatedByUserId: 'u1',
  totalMessages: 0,
  pinned: false,
  ...over,
});

describe('applyThreadToCache', () => {
  it('writes to detail cache so observers re-render without a refetch', () => {
    const qc = new QueryClient();
    qc.setQueryData<MessageThread>(
      threadsKeys.detail('w1', 't1'),
      thread({ isFlowRunning: false })
    );

    applyThreadToCache(qc, thread({ isFlowRunning: true }));

    const detail = qc.getQueryData<MessageThread>(
      threadsKeys.detail('w1', 't1')
    );
    expect(detail?.isFlowRunning).toBe(true);
  });

  it('splices into a non-infinite list cache and returns true', () => {
    const qc = new QueryClient();
    qc.setQueryData<ThreadsResponse>(threadsKeys.list('w1'), {
      data: [thread({ isFlowRunning: false })],
      total: 1,
    });

    const found = applyThreadToCache(qc, thread({ isFlowRunning: true }));

    expect(found).toBe(true);
    const list = qc.getQueryData<ThreadsResponse>(threadsKeys.list('w1'));
    expect(list?.data[0].isFlowRunning).toBe(true);
  });

  it('splices into infinite-list pages', () => {
    const qc = new QueryClient();
    const infiniteKey = threadsKeys.list('w1', { take: 30 });
    qc.setQueryData(infiniteKey, {
      pages: [{ data: [thread({ isFlowRunning: false })], total: 1 }],
      pageParams: [0],
    });

    const found = applyThreadToCache(qc, thread({ isFlowRunning: true }));

    expect(found).toBe(true);
    const cached = qc.getQueryData<{
      pages: ThreadsResponse[];
    }>(infiniteKey);
    expect(cached?.pages[0].data[0].isFlowRunning).toBe(true);
  });

  it('returns false when no list cache contains the thread (caller can refetch)', () => {
    const qc = new QueryClient();
    qc.setQueryData<ThreadsResponse>(threadsKeys.list('w1'), {
      data: [thread({ id: 'other' })],
      total: 1,
    });

    const found = applyThreadToCache(qc, thread({ id: 't1' }));

    expect(found).toBe(false);
  });

  it("only touches list caches matching the thread's workspace", () => {
    const qc = new QueryClient();
    qc.setQueryData<ThreadsResponse>(threadsKeys.list('w1'), {
      data: [thread({ workSpaceId: 'w1', isFlowRunning: false })],
      total: 1,
    });
    qc.setQueryData<ThreadsResponse>(threadsKeys.list('w2'), {
      data: [thread({ workSpaceId: 'w2', id: 't1', isFlowRunning: false })],
      total: 1,
    });

    applyThreadToCache(qc, thread({ workSpaceId: 'w1', isFlowRunning: true }));

    const w1 = qc.getQueryData<ThreadsResponse>(threadsKeys.list('w1'));
    const w2 = qc.getQueryData<ThreadsResponse>(threadsKeys.list('w2'));
    expect(w1?.data[0].isFlowRunning).toBe(true);
    expect(w2?.data[0].isFlowRunning).toBe(false);
  });
});

describe('setThreadRunningInLists', () => {
  it('flips isFlowRunning in lists without touching the detail cache', () => {
    const qc = new QueryClient();
    qc.setQueryData<MessageThread>(
      threadsKeys.detail('w1', 't1'),
      thread({ isFlowRunning: false })
    );
    qc.setQueryData<ThreadsResponse>(threadsKeys.list('w1'), {
      data: [thread({ isFlowRunning: false })],
      total: 1,
    });

    setThreadRunningInLists(qc, 'w1', 't1', true);

    // Detail cache stays untouched — gates the SSE, must remain
    // server-confirmed.
    expect(
      qc.getQueryData<MessageThread>(threadsKeys.detail('w1', 't1'))
        ?.isFlowRunning
    ).toBe(false);
    // Sidebar list reflects the optimistic flip.
    expect(
      qc.getQueryData<ThreadsResponse>(threadsKeys.list('w1'))?.data[0]
        .isFlowRunning
    ).toBe(true);
  });

  it('rolls back when toggled false', () => {
    const qc = new QueryClient();
    qc.setQueryData<ThreadsResponse>(threadsKeys.list('w1'), {
      data: [thread({ isFlowRunning: true })],
      total: 1,
    });

    setThreadRunningInLists(qc, 'w1', 't1', false);

    expect(
      qc.getQueryData<ThreadsResponse>(threadsKeys.list('w1'))?.data[0]
        .isFlowRunning
    ).toBe(false);
  });
});
