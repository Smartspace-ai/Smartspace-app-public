import { describe, expect, it } from 'vitest';

import {
  mapSignalRThreadSummaryToModel,
  mapThreadDtoToModel,
} from '@smartspace/chat-ui';

describe('thread mappers', () => {
  it('mapThreadDtoToModel sets summaryEmittedAt from lastUpdatedAt epoch ms', () => {
    const result = mapThreadDtoToModel({
      id: 't1',
      workSpaceId: 'w1',
      name: 'Thread',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'me',
      createdByUserId: 'u1',
      isFlowRunning: true,
      lastUpdatedAt: '2024-02-15T12:30:45Z',
      lastUpdatedByUserId: 'u1',
      totalMessages: 3,
      favorited: false,
    } as Parameters<typeof mapThreadDtoToModel>[0]);

    expect(result.summaryEmittedAt).toBe(
      new Date('2024-02-15T12:30:45Z').getTime()
    );
    expect(result.summaryEmittedAt).toBe(result.lastUpdatedAt.getTime());
  });

  it('mapSignalRThreadSummaryToModel sets summaryEmittedAt from lastUpdatedAt epoch ms', () => {
    const result = mapSignalRThreadSummaryToModel({
      id: 't2',
      workSpaceId: 'w1',
      name: 'Thread 2',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'me',
      createdByUserId: 'u1',
      isFlowRunning: false,
      lastUpdatedAt: '2024-03-20T09:15:30Z',
      lastUpdatedByUserId: 'u1',
      totalMessages: 5,
      favorited: true,
    } as Parameters<typeof mapSignalRThreadSummaryToModel>[0]);

    expect(result.summaryEmittedAt).toBe(
      new Date('2024-03-20T09:15:30Z').getTime()
    );
    expect(result.summaryEmittedAt).toBe(result.lastUpdatedAt.getTime());
  });
});
