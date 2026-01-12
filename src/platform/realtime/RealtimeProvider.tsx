// src/platform/realtime/RealtimeProvider.tsx
import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';

import { parseScopes } from '@/platform/auth/scopes';

type RealtimeCtx = {
  connection?: HubConnection;
  subscribeToGroup(name: string): Promise<void>;
  unsubscribeFromGroup(name: string): Promise<void>;
  ensureConnected(): Promise<void>;
};

const Ctx = createContext<RealtimeCtx | null>(null);
export const useRealtime = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRealtime must be used within <RealtimeProvider>');
  return ctx;
};

export type RealtimeProviderProps = {
  children: ReactNode;
  /** returns a bearer token; scopes are optional (depends on your backend) */
  getAccessToken: (scopes?: string[]) => Promise<string>;
  /** override base url if needed (defaults to env/ssconfig) */
  baseUrl?: string;
  /** hub path (default: "/notifications") */
  hubPath?: string;
  /** force WS only (default: negotiate best) */
  webSocketsOnly?: boolean;
  /** scopes (default: VITE_CLIENT_SCOPES) */
  scopes?: string[];
};

const defaultBaseUrl = () => {
  type SsConfig = { Chat_Api_Uri?: unknown };
  type SsWindow = Window & { ssconfig?: SsConfig };
  const cfg = (() => {
    try {
      const w = window as unknown as SsWindow;
      return w.ssconfig?.Chat_Api_Uri ?? import.meta.env.VITE_CHAT_API_URI;
    } catch {
      return import.meta.env.VITE_CHAT_API_URI;
    }
  })();
  return (typeof cfg === 'string' && cfg.length) ? cfg : '';
};

export function RealtimeProvider({
  children,
  getAccessToken,
  baseUrl = defaultBaseUrl(),
  hubPath = '/notifications',
  webSocketsOnly = false,
  scopes = parseScopes(import.meta.env.VITE_CLIENT_SCOPES),
}: RealtimeProviderProps) {
  const [connection, setConnection] = useState<HubConnection>();
  const desiredGroups = useRef<Set<string>>(new Set());
  const startPromise = useRef<Promise<void> | null>(null);

  const hubUrl = (baseUrl ?? '').replace(/\/$/, '') + hubPath;

  const isConnected = useCallback(
    () => connection?.state === HubConnectionState.Connected,
    [connection]
  );

  const ensureConnected = useCallback(async () => {
    if (!connection) throw new Error('Realtime not initialized');
    if (isConnected()) return;
    if (startPromise.current) return startPromise.current;

    startPromise.current = connection.start().finally(() => {
      startPromise.current = null;
    });
    return startPromise.current;
  }, [connection, isConnected, hubUrl]);

  const invokeWithRetry = useCallback(
    async (method: 'joinGroup' | 'leaveGroup', groupName: string, attempt = 0): Promise<void> => {
      if (!connection || !isConnected()) {
        return; // lifecycle will re-join
      }
      try {
        await connection.invoke(method, groupName);
      } catch (err) {
        if (attempt < 3) {
          const delay = 300 * Math.pow(2, attempt) + Math.random() * 100;
          await new Promise(r => setTimeout(r, delay));
          return invokeWithRetry(method, groupName, attempt + 1);
        }
        // eslint-disable-next-line no-console
        console.error(`${method} failed after retries`, groupName, err);
      }
    },
    [connection, isConnected]
  );

  const subscribeToGroup = useCallback(async (name: string) => {
    desiredGroups.current.add(name);
    await invokeWithRetry('joinGroup', name);
  }, [invokeWithRetry]);

  const unsubscribeFromGroup = useCallback(async (name: string) => {
    desiredGroups.current.delete(name);
    await invokeWithRetry('leaveGroup', name);
  }, [invokeWithRetry]);

  // build/start connection once
  useEffect(() => {
    if (!hubUrl) return;
    // Guard: avoid negotiating against a relative path when no baseUrl is configured
    const hasValidBaseUrl = typeof baseUrl === 'string' && /^https?:\/\//i.test(baseUrl);
    if (!hasValidBaseUrl) {
      console.warn('[Realtime] Skipping connection: no valid baseUrl configured');
      return;
    }

    const builder = new HubConnectionBuilder().withUrl(hubUrl, {
      accessTokenFactory: async () => {
        try { return await getAccessToken(scopes); } catch { return ''; }
      },
      ...(webSocketsOnly
        ? { transport: HttpTransportType.WebSockets, skipNegotiation: true }
        : {}),
    }).withAutomaticReconnect();

    const conn = builder.build();

    // rejoin desired groups after reconnect
    const rejoin = async () => {
      if (conn.state !== HubConnectionState.Connected) return;
      for (const g of desiredGroups.current) {
        try {
          await conn.invoke('joinGroup', g);
        } catch {
          console.error('Error joining group', g);
        }
      }
    };
    conn.onreconnected(rejoin);

    // start
    startPromise.current = conn.start()
      .catch(err => {
        console.error('Error starting realtime connection', err);
      })
      .finally(() => { startPromise.current = null; });
    setConnection(conn);

    return () => {
      startPromise.current = null;
      conn.stop().catch(() => {
        console.error('Error stopping connection');
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubUrl, getAccessToken, webSocketsOnly, JSON.stringify(scopes)]);

  const value = useMemo<RealtimeCtx>(() => ({
    connection,
    subscribeToGroup,
    unsubscribeFromGroup,
    ensureConnected,
  }), [connection, subscribeToGroup, unsubscribeFromGroup, ensureConnected]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
