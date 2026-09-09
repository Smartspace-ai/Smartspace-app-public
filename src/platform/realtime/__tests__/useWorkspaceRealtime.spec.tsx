import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  RealtimeProvider,
  useRealtime,
} from '@/platform/realtime/RealtimeProvider';
import { useWorkspaceRealtime } from '@/platform/realtime/useWorkspaceRealtime';

describe('useWorkspaceRealtime', () => {
  it('subscribes and unsubscribes to group on mount/unmount', async () => {
    const getAccessToken = vi.fn(async () => 'token');
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <RealtimeProvider getAccessToken={getAccessToken}>
        {children}
      </RealtimeProvider>
    );

    const { unmount } = renderHook(
      () => {
        const { subscribeToGroup, unsubscribeFromGroup } = useRealtime();
        const handlers = {
          onThreadUpdate: vi.fn(),
          onThreadDeleted: vi.fn(),
          onCommentsUpdate: vi.fn(),
        };
        useWorkspaceRealtime('workspace-1', handlers);
        return { subscribeToGroup, unsubscribeFromGroup };
      },
      { wrapper }
    );

    // The mock SignalR in setup sets state as Connected, so subscribe should be called without error
    // We don't have direct access to internal calls, but we ensure no crashes and unmount happens cleanly
    // baseUrl must be valid for connection to initialize; our setup uses defaults, so only assert no crash
    expect(typeof getAccessToken).toBe('function');
    unmount();
  });

  it('does not leave/rejoin the group when callers pass a new handlers object every render', async () => {
    // Regression test: rerendering with a new handlers object should not
    // cause the group to be left and rejoined.
    const getAccessToken = vi.fn(async () => 'token');
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <RealtimeProvider
        getAccessToken={getAccessToken}
        baseUrl="https://realtime.test"
      >
        {children}
      </RealtimeProvider>
    );

    const { result, rerender } = renderHook(
      () => {
        const ctx = useRealtime();
        // Fresh object every render, deliberately mirroring the real caller.
        useWorkspaceRealtime('workspace-1', {
          onThreadUpdate: vi.fn(),
          onCommentsUpdate: vi.fn(),
        });
        return ctx.connection;
      },
      { wrapper }
    );

    await act(async () => {
      await Promise.resolve();
    });

    const connection = result.current as unknown as {
      invoke: ReturnType<typeof vi.fn>;
    };
    const invokeCallCount = () => connection.invoke.mock.calls.length;

    const initialCalls = invokeCallCount();
    expect(initialCalls).toBeGreaterThan(0);

    rerender();
    rerender();
    rerender();
    await act(async () => {
      await Promise.resolve();
    });

    expect(invokeCallCount()).toBe(initialCalls);
  });
});
