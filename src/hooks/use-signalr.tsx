import { useTeams } from '@/contexts/teams-context';
import { normalizeNotificationType, NotificationType } from '@/domains/notifications/schemas';
import { useActiveUser } from '@/domains/users/use-active-user';

import { useAuth } from '@/platform/auth/session';
import { useIsAuthenticated } from '@azure/msal-react';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const signalRUri: string =
  (window as any)?.ssconfig?.Chat_Api_Uri ||
  import.meta.env.VITE_CHAT_API_URI||
  '';

const SignalRContext = createContext<{
  connection?: HubConnection;
  joinGroup?: (name: string) => Promise<void>;
  leaveGroup?: (name: string) => Promise<void>;
  subscribeToGroup?: (name: string) => Promise<void>;
  unsubscribeFromGroup?: (name: string) => Promise<void>;
  ensureConnected?: () => Promise<void>;
}>({});

type SignalRProviderProps = {
  children?: React.ReactNode;
};

export const SignalRProvider: FC<SignalRProviderProps> = ({ children }) => {
  const { getAccessToken } = useAuth();
  const { id: activeUserId } = useActiveUser();
  const { isInTeams, isTeamsInitialized, teamsUser } = useTeams();
  const msalIsAuthenticated = useIsAuthenticated();
  const queryClient = useQueryClient();

  // Determine authentication status using the same pattern as other parts of the app
  const teamsTokenPresent = (() => {
    try { return !!sessionStorage.getItem('teamsAuthToken') } catch { return false }
  })();
  const isTeamsAuthed = isInTeams && (teamsTokenPresent || (!!teamsUser && isTeamsInitialized));
  const isAuthenticated = isTeamsAuthed || msalIsAuthenticated;

  const [connection, setConnection] = useState<HubConnection>();
  const desiredGroupsRef = useRef<Set<string>>(new Set());
  const startPromiseRef = useRef<Promise<void> | null>(null);

  const isConnected = useCallback(
    () => connection?.state === HubConnectionState.Connected,
    [connection],
  );

  const ensureConnected = useCallback((): Promise<void> => {
    if (isConnected()) return Promise.resolve();
    if (!connection)
      return Promise.reject(new Error('SignalR not initialized'));

    if (startPromiseRef.current) {
      return startPromiseRef.current.catch(() => {
        return new Promise<void>((resolve) => {
          connection.onreconnected(() => resolve());
        });
      });
    }

    return new Promise<void>((resolve) => {
      connection.onreconnected(() => resolve());
    });
  }, [connection, isConnected]);

  const retryInvoke = useCallback(
    async (
      method: 'joinGroup' | 'leaveGroup',
      groupName: string,
      attempt = 0,
    ): Promise<void> => {
      const maxAttempts = 3;
      const baseDelayMs = 300;

      if (!connection) throw new Error('SignalR not initialized');
      if (!isConnected()) {
        // don't force connect here; queue and let connect lifecycle handle it
        throw new Error('SignalR not connected');
      }

      try {
        await connection.invoke(method, groupName);
      } catch (error) {
        if (attempt < maxAttempts - 1) {
          const jitter = Math.random() * 100;
          const delay = baseDelayMs * Math.pow(2, attempt) + jitter;
          await new Promise((r) => setTimeout(r, delay));
          return retryInvoke(method, groupName, attempt + 1);
        }
        // eslint-disable-next-line no-console
        console.error(`${method} failed after retries`, groupName, error);
        throw error;
      }
    },
    [connection, isConnected],
  );

  // helper functions to manage groups
  const subscribeToGroup = useCallback(
    async (groupName: string) => {
      desiredGroupsRef.current.add(groupName);
      if (!connection || !isConnected()) return;
      try {
        await retryInvoke('joinGroup', groupName);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('subscribeToGroup failed', groupName, e);
      }
    },
    [connection, isConnected, retryInvoke],
  );

  const unsubscribeFromGroup = useCallback(
    async (groupName: string) => {
      desiredGroupsRef.current.delete(groupName);
      if (!connection || !isConnected()) return;
      try {
        await retryInvoke('leaveGroup', groupName);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('unsubscribeFromGroup failed', groupName, e);
      }
    },
    [connection, isConnected, retryInvoke],
  );

  const joinGroup = useCallback(
    (groupName: string) => subscribeToGroup(groupName),
    [subscribeToGroup],
  );

  const leaveGroup = useCallback(
    (groupName: string) => unsubscribeFromGroup(groupName),
    [unsubscribeFromGroup],
  );

  // SignalR for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !signalRUri || !queryClient) return;

    // If a connection already exists and isn't fully disconnected, reuse it
    if (
      connection &&
      connection.state !== HubConnectionState.Disconnected &&
      connection.state !== HubConnectionState.Disconnecting
    ) {
      return;
    }

    const conn = new HubConnectionBuilder()
      .withUrl(
        signalRUri +
          (signalRUri.endsWith('/') ? 'notifications' : '/notifications'),
        {
          accessTokenFactory: async () => {
            try {
              const scopes = import.meta.env.VITE_CLIENT_SCOPES?.split(',') || [];
              const token = await getAccessToken({ scopes });
              return token ?? '';
            } catch {
              return '';
            }
          },
        },
      )
      .withAutomaticReconnect()
      .build();

    const userGroup = activeUserId && activeUserId !== 'anonymous' ? activeUserId : undefined;
    if (userGroup) desiredGroupsRef.current.add(userGroup);

    const localRetryInvoke = async (
      method: 'joinGroup' | 'leaveGroup',
      groupName: string,
      attempt = 0,
    ): Promise<void> => {
      const maxAttempts = 3;
      const baseDelayMs = 300;
      try {
        await conn.invoke(method, groupName);
      } catch (error) {
        if (attempt < maxAttempts - 1) {
          const jitter = Math.random() * 100;
          const delay = baseDelayMs * Math.pow(2, attempt) + jitter;
          await new Promise((r) => setTimeout(r, delay));
          return localRetryInvoke(method, groupName, attempt + 1);
        }
        // eslint-disable-next-line no-console
        console.error(
          `[local] ${method} failed after retries`,
          groupName,
          error,
        );
      }
    };

    const localRejoinDesired = async () => {
      if (conn.state !== HubConnectionState.Connected) return;
      for (const group of desiredGroupsRef.current) {
        await localRetryInvoke('joinGroup', group);
      }
    };

    startPromiseRef.current = conn
      .start()
      .then(async () => {
        try {
          if (userGroup) {
            await conn.invoke('joinGroup', userGroup);
          }
          await localRejoinDesired();
          conn.on('ReceiveMessage', (_name: string, json: string) => {
            try {
              const raw = JSON.parse(json) as { notificationType?: unknown; NotificationType?: unknown } & Record<string, unknown>;
              const rawType = raw?.notificationType ?? raw?.NotificationType;
              const type = normalizeNotificationType(rawType);
              if (type === NotificationType.CommentUpdated) {
                queryClient.invalidateQueries({ queryKey: ['comments'] });
                queryClient.invalidateQueries({ queryKey: ['threads'] });
              }
              if (type === NotificationType.MessageThreadUpdated) {
                console.log("message thread updated")
              }
              if (type === NotificationType.WorkSpaceUpdated) {
                console.log("work space updated")
              }
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            } catch (e) {
              console.error('Failed to parse notification payload', e);
            }
          });

          conn?.on(
            'BlocksUpdate',
            debounce(() => {
              queryClient.invalidateQueries({ queryKey: ['blocks'] });
            }, 100),
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error joining user or rejoining groups:', error);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error establishing connection:', error);
      });

    conn.onreconnected(async () => {
      await localRejoinDesired();
    });

    setConnection(conn);

    return () => {
      startPromiseRef.current = null;
      conn.off('ReceiveMessage');
      conn?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, queryClient, signalRUri, getAccessToken, activeUserId]);

  return (
    <SignalRContext.Provider
      value={{
        connection,
        joinGroup,
        leaveGroup,
        subscribeToGroup,
        unsubscribeFromGroup,
        ensureConnected,
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => useContext(SignalRContext);
