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
  children?: React.ReactNode;
};

export const SignalRProvider: FC<SignalRProviderProps> = ({ children }) => {
  const { accounts } = useMsal();
  const queryClient = useQueryClient();

  const [connection, setConnection] = useState<HubConnection>();

  // SignalR for real-time notifications
  useEffect(() => {
    if (!accounts.length || !signalRUri || !queryClient) return;

  

    const connection = new HubConnectionBuilder()
      .withUrl(
        signalRUri +
          (signalRUri.endsWith('/') ? 'notifications' : '/notifications'),
        {
          accessTokenFactory: () => accounts[0]?.idToken || '',
        },
      )
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        // console.log('Connection established.');
        // Join the group
        connection
          // get active account to join the group
          .invoke('joinGroup', accounts[0].localAccountId)
          .then(() => {
            // console.log('Joined group successfully');

            connection?.on(
              'BlocksUpdate',
              debounce(() => {
                queryClient.invalidateQueries({ queryKey: ['blocks'] });
              }, 100),
            );
          })
          .catch((error) => console.error('Error joining group:', error));
      })
      .catch((error) => console.error('Error establishing connection:', error));

    setConnection(connection);

    return () => {
      connection?.stop();
    };
  }, [accounts, queryClient]);

  return (
    <SignalRContext.Provider value={{ connection }}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => useContext(SignalRContext);
