import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock MSAL/Teams/SignalR related modules to avoid real network/SSO in unit tests
vi.mock('@/platform/auth/msalClient', () => ({
  msalInstance: {
    acquireTokenSilent: vi.fn(async () => ({ accessToken: 'test-token' })),
    loginRedirect: vi.fn(async () => undefined),
    logoutRedirect: vi.fn(async () => undefined),
    getActiveAccount: vi.fn(() => null),
    getAllAccounts: vi.fn(() => []),
    setActiveAccount: vi.fn(() => undefined),
  },
}));

// Auth: main exports isInTeams from msalConfig; routing helper lives outside auth.
vi.mock('@/platform/auth/msalConfig', async (orig) => {
  const mod = (await orig()) as any;
  return { ...(mod ?? {}), isInTeams: () => false };
});

vi.mock('@/platform/auth/naaClient', () => ({
  acquireNaaToken: vi.fn(async () => 'test-token'),
}));

// Minimal SignalR mock for tests importing Realtime components
vi.mock('@microsoft/signalr', () => ({
  HttpTransportType: { WebSockets: 1 },
  HubConnectionState: { Connected: 'Connected' },
  HubConnectionBuilder: class {
    withUrl() { return this; }
    withAutomaticReconnect() { return this; }
    build() {
      return {
        connectionId: 'test-connection-id',
        state: 'Connected',
        start: vi.fn(async () => undefined),
        stop: vi.fn(async () => undefined),
        onreconnected: vi.fn(),
        onreconnecting: vi.fn(),
        onclose: vi.fn(),
        invoke: vi.fn(async () => undefined),
        on: vi.fn(),
        off: vi.fn(),
      };
    }
  },
}));


