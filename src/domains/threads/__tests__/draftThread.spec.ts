import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ensureDraftThread } from '@/domains/threads/draftThread';

import { type MessageThread, threadsKeys } from '@smartspace/chat-ui';

describe('ensureDraftThread', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-01T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('stamps the new draft with summaryEmittedAt = Date.now() so applyThreadToCache treats it as fresh', () => {
    const qc = new QueryClient();
    const { draftId, isExisting } = ensureDraftThread('w1', qc);

    expect(isExisting).toBe(false);
    const cached = qc.getQueryData<MessageThread>(
      threadsKeys.detail('w1', draftId)
    );
    expect(cached?.summaryEmittedAt).toBe(
      new Date('2024-06-01T12:00:00Z').getTime()
    );
    expect(cached?.summaryEmittedAt).toBe(cached?.lastUpdatedAt.getTime());
  });
});
