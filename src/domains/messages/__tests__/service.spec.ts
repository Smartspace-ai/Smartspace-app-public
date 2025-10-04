import { describe, expect, it, vi } from 'vitest';

import * as api from '@/platform/api';
import * as apiParsed from '@/platform/apiParsed';

import { fetchMessages, postMessage } from '@/domains/messages';

type ProgressEventLike = { event: { currentTarget: { response: string } } };

describe('messages service', () => {
  it('fetchMessages returns mapped list', async () => {
    const msg = { id: 'm1', createdAt: '2024-01-01', createdBy: 'u1', hasComments: true, createdByUserId: 'u1', messageThreadId: 't1', values: [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed, 'getParsed').mockResolvedValueOnce({ data: [msg] } as any);
    const res = await fetchMessages('t1');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('m1');
    spy.mockRestore();
  });

  it('postMessage emits mapped messages from SSE progress', async () => {
    // Instead of touching module internals, mock api.post directly
    const postSpy = vi.spyOn(api.api, 'post').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (_url: string, _payload: any, cfg?: any) => {
        const cb = cfg?.onDownloadProgress as ((e: ProgressEventLike) => void) | undefined;
        if (cb) {
          const chunk = JSON.stringify({ id: 'm2', createdAt: '2024-01-01', createdBy: 'u1', hasComments: false, createdByUserId: 'u1', messageThreadId: 't1', values: [] });
          // simulate same concatenating behavior used by axios' xhr adapter
          cb({ event: { currentTarget: { response: `data:${chunk}\n\n` } } });
          cb({ event: { currentTarget: { response: `data:${chunk}\n\ndata:${chunk}\n\n` } } });
        }
        return undefined as unknown as never;
      }
    );

    const obs = await postMessage({ workSpaceId: 'w', threadId: 't1' });
    const received: Array<{ id?: string | null }> = [];
    obs.subscribe((m: { id?: string | null }) => received.push(m));
    // allow microtask
    await Promise.resolve();
    expect(received.length).toBeGreaterThan(0);
    expect(received[0].id).toBe('m2');
    postSpy.mockRestore();
  });
});


