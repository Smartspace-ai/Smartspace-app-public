/**
 * Guards the "first joinGroup silently dropped while still Connecting" race.
 *
 * Before the fix, `subscribeToGroup` invoked the hub immediately. If the
 * effect ran while `conn.start()` was still in flight (state === 'Connecting'),
 * the bail-out branch returned silently. `onreconnected` only fires on
 * reconnects, not initial connect, so the join never happened — the client
 * stayed absent from the workspace group until something forced a reconnect.
 */
import { renderHook } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { invokeMock, ConnectionStub } = vi.hoisted(() => {
  const invokeMock = vi.fn(async () => undefined);

  class ConnectionStub {
    state = 'Connecting';
    connectionId = 'test';
    invoke = invokeMock;
    on = vi.fn();
    off = vi.fn();
    onreconnected = vi.fn();
    onreconnecting = vi.fn();
    onclose = vi.fn();
    private resolveStart: (() => void) | null = null;

    start = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          this.resolveStart = resolve;
        })
    );
    stop = vi.fn(async () => undefined);

    completeStart() {
      this.state = 'Connected';
      this.resolveStart?.();
    }
  }

  return { invokeMock, ConnectionStub };
});

let conn: InstanceType<typeof ConnectionStub>;

vi.mock('@microsoft/signalr', () => ({
  HttpTransportType: { WebSockets: 1 },
  HubConnectionState: { Connected: 'Connected' },
  HubConnectionBuilder: class {
    withUrl() {
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    build() {
      conn = new ConnectionStub();
      return conn;
    }
  },
}));

import {
  RealtimeProvider,
  useRealtime,
} from '@/platform/realtime/RealtimeProvider';

const wrapper = (
  getAccessToken = vi.fn(async () => 'tok')
): React.FC<React.PropsWithChildren> =>
  function Wrapper({ children }) {
    return (
      <RealtimeProvider
        baseUrl="https://hub.test"
        getAccessToken={getAccessToken}
      >
        {children}
      </RealtimeProvider>
    );
  };

describe('RealtimeProvider initial-connect race', () => {
  beforeEach(() => {
    invokeMock.mockClear();
  });

  afterEach(() => {
    // Resolve any pending start promise so React Testing Library can clean up
    conn?.completeStart();
  });

  it('does not invoke joinGroup until the connection is Connected', async () => {
    const { result } = renderHook(() => useRealtime(), { wrapper: wrapper() });

    // Fire-and-forget the subscribe. invokeWithRetry awaits startPromise
    // before invoking, so JoinGroup must NOT have hit the wire yet while
    // the connection is still in 'Connecting' state.
    const subscribePromise = result.current.subscribeToGroup('workspace-1');
    await Promise.resolve();
    expect(invokeMock).not.toHaveBeenCalled();

    // Flip the connection to Connected.
    conn.completeStart();
    await subscribePromise;

    // Now JoinGroup should have been invoked exactly once with the workspace id.
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith('JoinGroup', 'workspace-1');
  });
});
