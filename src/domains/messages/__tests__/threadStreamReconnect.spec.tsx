import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useThreadMessageStream } from '@/domains/messages/threadStream';

import { messagesKeys } from '@smartspace/chat-ui';

import { streamThreadMessages } from '../service';

vi.mock('../service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../service')>()),
  streamThreadMessages: vi.fn(),
}));

const streamMock = vi.mocked(streamThreadMessages);

const summary = (isFlowRunning: boolean) => ({
  id: 't1',
  workSpaceId: 'w1',
  name: 'Thread',
  totalMessages: 1,
  favorited: false,
  isFlowRunning,
  createdAt: '2024-01-01T00:00:00',
  createdByUserId: 'u1',
  createdBy: 'User',
  lastUpdatedAt: '2024-01-01T00:00:00',
  lastUpdatedByUserId: 'u1',
  lastUpdated: 'User',
});

/** A connection that ends immediately, without reporting the run finished. */
const closesAtOnce = async () => ({ status: 'completed' as const });

const serverMessage = {
  id: 'm1',
  values: [],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: 'Server',
  createdByUserId: 'u1',
};

/**
 * A connection that delivers a snapshot and then runs a while before dropping
 * — the ingress-timeout shape, and the only shape that counts as healthy.
 */
const deliversThenClosesAfter =
  (ms: number) =>
  async ({
    onSnapshot,
    onMessage,
  }: {
    onSnapshot: (m: unknown[]) => void;
    onMessage: (id: string, m: unknown, terminal: boolean) => void;
  }) => {
    onSnapshot([serverMessage]);
    // A frame AFTER the snapshot — every open sends a snapshot, so only this
    // marks the connection as having actually produced anything.
    onMessage('m1', serverMessage, false);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
    return { status: 'completed' as const };
  };

// One client for the whole render, not one per render pass — a fresh client
// each pass would change the hook's `qc` dependency and restart the effect,
// which is exactly the thing under test.
let queryClient: QueryClient;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const mount = () =>
  renderHook(() => useThreadMessageStream('t1', true), { wrapper });

describe('useThreadMessageStream reconnect', () => {
  beforeEach(() => {
    //  must be faked too: connection health is measured with the
    // monotonic clock, and leaving it real would make every connection look
    // instantaneous and quietly kill the branch under test.
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'Date',
        'performance',
      ],
    });
    streamMock.mockReset();
    queryClient = new QueryClient();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stops after a close that reported the run finished', async () => {
    streamMock.mockImplementation(async ({ onThread }) => {
      onThread?.(summary(false), true);
      return { status: 'completed' as const };
    });

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(30_000);
    unmount();

    expect(streamMock).toHaveBeenCalledTimes(1);
  });

  it('reopens after a clean close that never reported the run finished', async () => {
    streamMock.mockImplementation(closesAtOnce);

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(5_000);
    unmount();

    // Before the fix this stalled on a single connection forever, leaving the
    // running indicator on with nothing left to clear it.
    expect(streamMock.mock.calls.length).toBeGreaterThan(1);
  });

  it('stops once a reopened stream reports the run finished', async () => {
    // The self-termination the fix relies on: reopening is only safe because
    // the next snapshot frame carries the authoritative thread summary.
    streamMock
      .mockImplementationOnce(async ({ onThread }) => {
        onThread?.(summary(true), false);
        return { status: 'completed' as const };
      })
      .mockImplementation(async ({ onThread }) => {
        onThread?.(summary(false), true);
        return { status: 'completed' as const };
      });

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(30_000);
    unmount();

    expect(streamMock).toHaveBeenCalledTimes(2);
  });

  it('keeps reopening a connection that delivers and lasts', async () => {
    streamMock.mockImplementation(deliversThenClosesAfter(60_000));

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(600_000);
    unmount();

    expect(streamMock.mock.calls.length).toBeGreaterThan(8);
  });

  it('resets the backoff after a connection that delivered and lasted', async () => {
    // Four instant closes push the backoff up, then one healthy connection
    // has to bring it back down — the branch that scores connection health.
    const startedAt: number[] = [];
    const endedAt: number[] = [];
    let call = 0;

    streamMock.mockImplementation(async (opts) => {
      startedAt.push(Date.now());
      call += 1;
      if (call === 5) {
        await deliversThenClosesAfter(20_000)(opts as never);
      }
      endedAt.push(Date.now());
      return { status: 'completed' as const };
    });

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(200_000);
    unmount();

    // The gap after the healthy fifth connection must be the fresh 250-500ms
    // backoff, not the several seconds the four failures had escalated to.
    const gapAfterHealthy = startedAt[5] - endedAt[4];
    const gapBeforeHealthy = startedAt[4] - endedAt[3];
    expect(gapAfterHealthy).toBeLessThan(1_000);
    expect(gapBeforeHealthy).toBeGreaterThan(1_000);
  });

  it('keeps an in-flight optimistic input value across a reopen', async () => {
    // The shape useAddInputToMessage actually produces: a `temp-` VALUE
    // appended to a message that already carries a server id. A reopen
    // replacing that message wholesale is what deletes the answer a user just
    // typed into a waiting flow's form.
    queryClient.setQueryData(messagesKeys.list('t1'), [
      {
        ...serverMessage,
        values: [{ id: 'temp-abc-add', name: 'answer', type: 'Input' }],
      },
    ]);

    streamMock.mockImplementation(async ({ onSnapshot }) => {
      onSnapshot?.([serverMessage] as never);
      return { status: 'completed' as const };
    });

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(5_000);
    unmount();

    const list = queryClient.getQueryData<
      { id: string; values?: { id: string }[] }[]
    >(messagesKeys.list('t1'));
    expect(list?.[0].values?.map((v) => v.id)).toContain('temp-abc-add');
  });

  it('keeps an unsent optimistic message across a reopen', async () => {
    // useSendMessage's placeholder, flagged `optimistic` and not yet known to
    // the server.
    queryClient.setQueryData(messagesKeys.list('t1'), [
      { ...serverMessage, id: 'temp-send', optimistic: true },
    ]);

    streamMock.mockImplementation(async ({ onSnapshot }) => {
      onSnapshot?.([serverMessage] as never);
      return { status: 'completed' as const };
    });

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(5_000);
    unmount();

    const list = queryClient.getQueryData<{ id: string }[]>(
      messagesKeys.list('t1')
    );
    expect(list?.map((m) => m.id)).toContain('temp-send');
    expect(list?.map((m) => m.id)).toContain('m1');
  });

  it('does not duplicate an optimistic message the snapshot already covers', async () => {
    queryClient.setQueryData(messagesKeys.list('t1'), [
      { ...serverMessage, optimistic: true },
    ]);

    streamMock.mockImplementation(async ({ onSnapshot }) => {
      onSnapshot?.([serverMessage] as never);
      return { status: 'completed' as const };
    });

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(5_000);
    unmount();

    const list = queryClient.getQueryData<{ id: string }[]>(
      messagesKeys.list('t1')
    );
    expect(list?.filter((m) => m.id === 'm1')).toHaveLength(1);
  });

  it('keeps streaming when a reopen snapshot reports the run finished', async () => {
    // The snapshot summary is read at request entry, before the tail
    // subscribes, so it can lag the run. Only a terminal frame ends the loop.
    streamMock.mockImplementation(async ({ onThread }) => {
      onThread?.(summary(false), false);
      return { status: 'completed' as const };
    });

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(30_000);
    unmount();

    expect(streamMock.mock.calls.length).toBeGreaterThan(1);
  });

  it('keeps retrying a backend that closes at once, without hammering it', async () => {
    streamMock.mockImplementation(closesAtOnce);

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(300_000);
    unmount();

    const calls = streamMock.mock.calls.length;
    // Never gives up — the run may still be going, and stopping would leave
    // the running indicator on with nothing to clear it.
    expect(calls).toBeGreaterThan(10);
    // But the backoff ceiling holds: an unhealthy connection never resets it,
    // so five minutes buys tens of attempts, not thousands.
    expect(calls).toBeLessThan(120);
  });

  it('keeps retrying a backend that fails at once, without hammering it', async () => {
    streamMock.mockImplementation(async () => {
      throw new Error('stream open failed with status 500');
    });

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(300_000);
    unmount();

    const calls = streamMock.mock.calls.length;
    expect(calls).toBeGreaterThan(10);
    expect(calls).toBeLessThan(120);
  });

  it('reconnects after a thrown error', async () => {
    streamMock
      .mockImplementationOnce(async () => {
        throw new Error('network down');
      })
      .mockImplementation(async ({ onThread }) => {
        onThread?.(summary(false), true);
        return { status: 'completed' as const };
      });

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(30_000);
    unmount();

    expect(streamMock).toHaveBeenCalledTimes(2);
  });

  it('stops on a refused stream without reopening', async () => {
    // No amount of reopening wins back access the server has refused. A 401
    // is deliberately NOT routed here — see the retry test below.
    streamMock.mockImplementation(async () => ({
      status: 'forbidden' as const,
      httpStatus: 403,
    }));

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(120_000);
    unmount();

    expect(streamMock).toHaveBeenCalledTimes(1);
  });

  it('stops on a 404 without reopening', async () => {
    streamMock.mockImplementation(async () => ({
      status: 'not-found' as const,
    }));

    const { unmount } = mount();
    await vi.advanceTimersByTimeAsync(30_000);
    unmount();

    expect(streamMock).toHaveBeenCalledTimes(1);
  });

  it('stops reopening once the hook is disabled', async () => {
    streamMock.mockImplementation(closesAtOnce);

    const { rerender, unmount } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useThreadMessageStream('t1', enabled),
      { wrapper, initialProps: { enabled: true } }
    );

    await vi.advanceTimersByTimeAsync(2_000);
    rerender({ enabled: false });
    const afterDisable = streamMock.mock.calls.length;

    await vi.advanceTimersByTimeAsync(30_000);
    unmount();

    expect(streamMock.mock.calls.length).toBe(afterDisable);
  });
});
