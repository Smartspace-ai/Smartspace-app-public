import { describe, expect, it } from 'vitest';

import { makeThreadSummary } from '@/test/factories';
import {
  mapSignalRThreadSummaryToModel,
  mapThreadDtoToModel,
} from '@smartspace/chat-ui';


describe('thread mappers', () => {
  it('mapThreadDtoToModel sets summaryEmittedAt from lastUpdatedAt epoch ms', () => {
    const dto = makeThreadSummary({ lastUpdatedAt: '2024-02-15T12:30:45Z' });
    const result = mapThreadDtoToModel(dto);

    expect(result.summaryEmittedAt).toBe(
      new Date('2024-02-15T12:30:45Z').getTime()
    );
    expect(result.summaryEmittedAt).toBe(result.lastUpdatedAt.getTime());
  });

  it('mapSignalRThreadSummaryToModel sets summaryEmittedAt from lastUpdatedAt epoch ms', () => {
    const dto = makeThreadSummary({ lastUpdatedAt: '2024-03-20T09:15:30Z' });
    const result = mapSignalRThreadSummaryToModel(dto);

    expect(result.summaryEmittedAt).toBe(
      new Date('2024-03-20T09:15:30Z').getTime()
    );
    expect(result.summaryEmittedAt).toBe(result.lastUpdatedAt.getTime());
  });
});
