import { describe, expect, it, vi } from 'vitest';

import { api } from '@/platform/api';
import { apiParsed } from '@/platform/apiParsed';

import { fetchMessages, postMessage } from '@/domains/messages';

type ProgressEventLike = { event: { currentTarget: { response: string } } };

describe('messages service', () => {
  it('fetchMessages returns mapped list', async () => {
    const envelope = { data: [{ id: 'm1', createdAt: '2024-01-01', createdBy: 'u1', hasComments: true, createdByUserId: 'u1', messageThreadId: 't1', values: [] }] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed, 'get').mockResolvedValueOnce(envelope as any);
    const res = await fetchMessages('t1');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('m1');
    spy.mockRestore();
  });

  it('postMessage sets up SSE handling (smoke)', async () => {
    // capture onDownloadProgress to trigger after subscription
    let capturedCb: ((e: ProgressEventLike) => void) | undefined;
    const postSpy = vi.spyOn(api, 'post').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (_url: string, _payload: any, cfg?: any) => {
        capturedCb = cfg?.onDownloadProgress as ((e: ProgressEventLike) => void) | undefined;
        return undefined as unknown as never;
      }
    );

    const obs = await postMessage({ workSpaceId: 'w', threadId: 't1' });

    // now simulate streaming frames after subscription
    const chunk = JSON.stringify({ id: 'm2', createdAt: '2024-01-01', createdBy: 'u1', hasComments: false, createdByUserId: 'u1', messageThreadId: 't1', values: [] });
    capturedCb?.({ event: { currentTarget: { response: `data:${chunk}\n\n` } } });
    capturedCb?.({ event: { currentTarget: { response: `data:${chunk}\n\ndata:${chunk}\n\n` } } });

    expect(typeof obs.subscribe).toBe('function');
    postSpy.mockRestore();
  });
});


