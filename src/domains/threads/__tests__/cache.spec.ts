import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
  applyThreadToCache,
  type MessageThread,
  threadsKeys,
} from '@smartspace/chat-ui';

const thread = (over: Partial<MessageThread> = {}): MessageThread => ({
  id: 't1',
  workSpaceId: 'w1',
  name: 'Thread',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: 'me',
  createdByUserId: 'u1',
  isFlowRunning: false,
  lastUpdatedAt: new Date('2024-01-01T00:00:00Z'),
  lastUpdatedByUserId: 'u1',
  totalMessages: 0,
  pinned: false,
  summaryEmittedAt: 1000,
  ...over,
});

describe('applyThreadToCache stale-summary guard', () => {
  it('rejects a write whose summaryEmittedAt is older than the existing detail cache', () => {
    const qc = new QueryClient();
    const fresh = thread({ summaryEmittedAt: 2000, isFlowRunning: false });
    qc.setQueryData<MessageThread>(
      threadsKeys.detail(fresh.workSpaceId, fresh.id),
      fresh
    );

    const stale = thread({ summaryEmittedAt: 1000, isFlowRunning: true });
    const applied = applyThreadToCache(qc, stale);

    expect(applied).toBe(false);
    const after = qc.getQueryData<MessageThread>(
      threadsKeys.detail(fresh.workSpaceId, fresh.id)
    );
    // Detail cache still holds the fresher write.
    expect(after?.isFlowRunning).toBe(false);
    expect(after?.summaryEmittedAt).toBe(2000);
  });

  it('accepts a write whose summaryEmittedAt is newer than the existing detail cache', () => {
    const qc = new QueryClient();
    const old = thread({ summaryEmittedAt: 1000, isFlowRunning: true });
    qc.setQueryData<MessageThread>(
      threadsKeys.detail(old.workSpaceId, old.id),
      old
    );

    const fresh = thread({ summaryEmittedAt: 2000, isFlowRunning: false });
    applyThreadToCache(qc, fresh);

    const after = qc.getQueryData<MessageThread>(
      threadsKeys.detail(old.workSpaceId, old.id)
    );
    expect(after?.isFlowRunning).toBe(false);
    expect(after?.summaryEmittedAt).toBe(2000);
  });

  it('accepts a write when the existing cache entry has no summaryEmittedAt (legacy)', () => {
    const qc = new QueryClient();
    const legacy = thread({
      isFlowRunning: true,
      // simulate a legacy cached value without the version field
      summaryEmittedAt: undefined as unknown as number,
    });
    qc.setQueryData<MessageThread>(
      threadsKeys.detail(legacy.workSpaceId, legacy.id),
      legacy
    );

    const incoming = thread({ summaryEmittedAt: 1000, isFlowRunning: false });
    applyThreadToCache(qc, incoming);

    const after = qc.getQueryData<MessageThread>(
      threadsKeys.detail(legacy.workSpaceId, legacy.id)
    );
    expect(after?.isFlowRunning).toBe(false);
  });
});
