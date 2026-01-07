import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Silence app logger in unit tests (tests can assert behavior without noisy stderr).
vi.mock('@/platform/log', () => ({
  isSsDebugEnabled: () => false,
  ssLog: vi.fn(),
  ssDebug: vi.fn(),
  ssInfo: vi.fn(),
  ssWarn: vi.fn(),
  ssError: vi.fn(),
}));

// JSDOM doesn't implement navigation; some code (e.g. file download via <a>.click())
// triggers "Not implemented: navigation" noise. Stub it globally for unit tests.
try {
  if (typeof HTMLAnchorElement !== 'undefined') {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  }
} catch {
  // ignore
}

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
  const mod = (await orig()) as unknown;
  const asObj = (mod && typeof mod === 'object') ? (mod as Record<string, unknown>) : {};
  return { ...asObj, isInTeams: () => false };
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


