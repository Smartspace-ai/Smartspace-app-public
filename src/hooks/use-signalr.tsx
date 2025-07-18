import { createContext, FC, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';

const signalRUri: string =
  (window as any)?.ssconfig?.Admin_Api_Uri ||
  import.meta.env.VITE_Admin_Api_Uri ||
  '';

const SignalRContext = createContext<{ connection?: HubConnection }>({});

type SignalRProviderProps = {
  threadId: string;
  children?: React.ReactNode;
};

export const SignalRProvider: FC<SignalRProviderProps> = ({  children }) => {
  const { accounts } = useMsal();
  const queryClient = useQueryClient();

  const [connection, setConnection] = useState<HubConnection>();

  useEffect(() => {
    if (!accounts.length || !signalRUri || !queryClient) return;

    const conn = new HubConnectionBuilder()
      .withUrl(
        `${signalRUri}${signalRUri.endsWith('/') ? 'messageHub' : '/messageHub'}`,
        {
          accessTokenFactory: () => accounts[0]?.idToken?.toString() || '',
        }
      )
      .withAutomaticReconnect()
      .build();

    conn
      .start()
      .then(async () => {
        console.log('SignalR connection established.');
        // Subscribe to the thread group

        // Trigger a full messages re-fetch when a message update arrives
        conn.on('ReceiveMessage', () => {
          console.log('Message update received, invalidating messages query');
          queryClient.invalidateQueries({ queryKey: ['messages'] });
        });

        // Log thread running state changes
        conn.on('ReceiveFlowStatus', (_tid, isRunning) => {
          if (_tid) {
            console.log('Thread running state:', isRunning);
          }
        });

        // Existing blocks update example (if still needed)
        conn.on(
          'BlocksUpdate',
          debounce(() => {
            queryClient.invalidateQueries({ queryKey: ['blocks'] });
          }, 100)
        );
      })
      .catch((error) => console.error('Error establishing SignalR:', error));

    setConnection(conn);

    return () => {
      conn.stop();
    };
  }, [accounts, queryClient]);

  return (
    <SignalRContext.Provider value={{ connection }}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => useContext(SignalRContext);
