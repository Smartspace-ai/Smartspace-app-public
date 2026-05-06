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
  it('rejects a stale write that would resurrect a settled false back to true', () => {
    // Original race: SSE terminal already wrote { running: false } with a
    // fresh timestamp, then a lagged SignalR `receiveThreadUpdate` with an
    // older timestamp arrives carrying the now-obsolete `running: true`.
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
    // Detail cache still holds the fresher write — running indicator stays cleared.
    expect(after?.isFlowRunning).toBe(false);
    expect(after?.summaryEmittedAt).toBe(2000);
  });

  it('accepts an older-timestamp write that flips running to false (terminal frame after fresher mid-flow updates)', () => {
    // Real-world case: SignalR mid-flow updates push summaryEmittedAt forward
    // (each broadcast carries a fresh wall-clock timestamp), then the SSE
    // terminal frame arrives carrying the original message-creation
    // `lastUpdatedAt` (which is older). The terminal frame must still be
    // applied — otherwise the running indicator never clears.
    const qc = new QueryClient();
    const midFlow = thread({ summaryEmittedAt: 2000, isFlowRunning: true });
    qc.setQueryData<MessageThread>(
      threadsKeys.detail(midFlow.workSpaceId, midFlow.id),
      midFlow
    );

    const terminal = thread({ summaryEmittedAt: 1000, isFlowRunning: false });
    applyThreadToCache(qc, terminal);

    const after = qc.getQueryData<MessageThread>(
      threadsKeys.detail(midFlow.workSpaceId, midFlow.id)
    );
    expect(after?.isFlowRunning).toBe(false);
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
