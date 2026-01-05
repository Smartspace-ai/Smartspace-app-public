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
  },
}));

vi.mock('@/platform/auth/utils', () => ({
  parseScopes: (raw?: unknown) => String(raw ?? '').split(/[ ,]+/).map((s) => s.trim()).filter(Boolean),
  isInTeams: () => false,
  normalizeRedirectPath: (raw?: string | null, fallback: string = '/workspace') => {
    const value = String(raw ?? '').trim();
    if (!value) return fallback;
    if (value.startsWith('/')) return value.startsWith('/login') ? fallback : value;
    try {
      const url = new URL(value, 'http://localhost');
      const path = `${url.pathname}${url.search}${url.hash}`;
      return path.startsWith('/login') ? fallback : (path || fallback);
    } catch {
      return fallback;
    }
  },
}));

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


