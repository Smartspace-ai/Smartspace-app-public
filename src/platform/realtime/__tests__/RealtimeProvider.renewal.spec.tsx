/**
 * After an in-page sign-in, a hub that died while the session was dead is
 * rebuilt. Before the popup, a sign-in reloaded the page, which rebuilt it.
 */
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { builds, startOutcome, mockPopup } = vi.hoisted(() => ({
  builds: [] as { state: string }[],
  startOutcome: { fail: true },
  mockPopup: vi.fn(async () => ({ switchedAccount: false })),
}));

vi.mock('@microsoft/signalr', () => ({
  HttpTransportType: { WebSockets: 1 },
  HubConnectionState: {
    Connected: 'Connected',
    Disconnected: 'Disconnected',
  },
  HubConnectionBuilder: class {
    withUrl() {
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    build() {
      const conn = {
        state: 'Connecting',
        onreconnected: vi.fn(),
        onclose: vi.fn(),
        stop: vi.fn(async () => undefined),
        start: vi.fn(async () => {
          if (startOutcome.fail) {
            conn.state = 'Disconnected';
            throw Object.assign(new Error('Unauthorized'), {
              statusCode: 401,
            });
          }
          conn.state = 'Connected';
        }),
      };
      builds.push(conn);
      return conn;
    }
  },
}));

vi.mock('@/platform/auth/providers/msalWeb', () => ({
  refreshWebTokenSilently: vi.fn(async () => {
    throw new Error('interaction_required');
  }),
  signInWithPopup: mockPopup,
}));

import { renewSessionWithPopup } from '@/platform/auth/sessionExpiry';
import { RealtimeProvider } from '@/platform/realtime/RealtimeProvider';

describe('RealtimeProvider after an in-page sign-in', () => {
  it('rebuilds a hub whose start failed while the session was dead, and leaves a live one alone', async () => {
    // Breaks if nothing listens for the renewal: realtime stays off until a
    // full reload.
    render(
      <RealtimeProvider
        baseUrl="https://hub.test"
        getAccessToken={async () => 'tok'}
      >
        <span />
      </RealtimeProvider>
    );
    await act(async () => undefined);
    expect(builds).toHaveLength(1);
    expect(builds[0].state).toBe('Disconnected');

    startOutcome.fail = false;
    await act(async () => {
      await renewSessionWithPopup();
    });

    expect(builds).toHaveLength(2);
    expect(builds[1].state).toBe('Connected');

    await act(async () => {
      await renewSessionWithPopup();
    });

    expect(builds).toHaveLength(2);
  });
});
