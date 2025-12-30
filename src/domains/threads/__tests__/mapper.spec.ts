import { describe, expect, it } from 'vitest';

import { mapThreadDtoToModel } from '@/domains/threads/mapper';

describe('threads mapper', () => {
  it('maps thread dto to model', () => {
    const dto = {
      id: 't1', createdAt: '2024-01-01', createdBy: 'u', createdByUserId: 'u', isFlowRunning: false,
      lastUpdated: '2024-01-02', lastUpdatedAt: '2024-01-02', lastUpdatedByUserId: 'u', name: 'Thread', totalMessages: 1,
    } as any;
    const m = mapThreadDtoToModel(dto);
    expect(m.id).toBe('t1');
  });
});
