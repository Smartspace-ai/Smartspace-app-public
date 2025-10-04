import { describe, expect, it, vi } from 'vitest';

import * as apiParsed from '@/platform/apiParsed';

import { fetchThread, fetchThreads, renameThread, setFavorite } from '@/domains/threads';

describe('threads service', () => {
  it('fetchThreads returns mapped response', async () => {
    const dto = {
      id: 't1', createdAt: '2024-01-01', createdBy: 'u', createdByUserId: 'u', isFlowRunning: false,
      lastUpdated: '2024-01-02', lastUpdatedAt: '2024-01-02', lastUpdatedByUserId: 'u', name: 'Thread', totalMessages: 1,
      favorited: null, avatarName: null, workSpaceId: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed.apiParsed, 'get').mockResolvedValueOnce({ data: [dto], total: 1 } as any);
    const res = await fetchThreads('w1');
    expect(res.total).toBe(1);
    expect(res.data[0].id).toBe('t1');
    spy.mockRestore();
  });

  it('fetchThread returns a mapped thread', async () => {
    const dto = {
      id: 't2', createdAt: '2024-01-01', createdBy: 'u', createdByUserId: 'u', isFlowRunning: false,
      lastUpdated: '2024-01-02', lastUpdatedAt: '2024-01-02', lastUpdatedByUserId: 'u', name: 'Thread', totalMessages: 2,
      favorited: true, avatarName: null, workSpaceId: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed.apiParsed, 'get').mockResolvedValueOnce(dto as any);
    const m = await fetchThread('w1', 't2');
    expect(m.id).toBe('t2');
    spy.mockRestore();
  });

  it('setFavorite calls put and returns void', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed.apiParsed, 'put').mockResolvedValueOnce(undefined as any);
    await expect(setFavorite('t1', true)).resolves.toBeUndefined();
    spy.mockRestore();
  });

  it('renameThread returns mapped thread', async () => {
    const dto = {
      id: 't3', createdAt: '2024-01-01', createdBy: 'u', createdByUserId: 'u', isFlowRunning: false,
      lastUpdated: '2024-01-02', lastUpdatedAt: '2024-01-02', lastUpdatedByUserId: 'u', name: 'New', totalMessages: 2,
      favorited: false, avatarName: null, workSpaceId: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed.apiParsed, 'put').mockResolvedValueOnce(dto as any);
    const m = await renameThread('t3', 'New');
    expect(m.name).toBe('New');
    spy.mockRestore();
  });
});


