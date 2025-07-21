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

// Updated provider that accepts a workspaceId for subscribing to a workspace hub

type WorkspaceSignalRProviderProps = {
  workspaceId: string;
  children?: React.ReactNode;
};

export const WorkspaceSignalRProvider: FC<WorkspaceSignalRProviderProps> = ({ workspaceId, children }) => {
  const { accounts } = useMsal();
  const queryClient = useQueryClient();

  const [connection, setConnection] = useState<HubConnection>();

  useEffect(() => {
    console.log('signalRUri', signalRUri);
    if (!accounts.length || !signalRUri || !queryClient || !workspaceId) return;

    console.log('workspaceId', workspaceId);

    const connection = new HubConnectionBuilder()
      .withUrl(
        signalRUri + (signalRUri.endsWith('/') ? 'workspace' : '/workspace'),
        {
          accessTokenFactory: () => accounts[0]?.idToken?.toString() || '',
        }
      )
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        connection
          .invoke('SubscribeToWorkspace', workspaceId)
          .then(() => {
            connection.on(
              'WorkspaceUpdate',
              debounce(() => {
                console.log('WorkspaceUpdate');
              }, 100)
            );
          })
          .catch((error) => console.error('Error subscribing to workspace:', error));
      })
      .catch((error) => console.error('Error establishing connection:', error));

    setConnection(connection);

    return () => {
      connection?.stop();
    };
  }, [accounts, queryClient, workspaceId]);

  return (
    <SignalRContext.Provider value={{ connection }}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useWorkspaceSignalR = () => useContext(SignalRContext);
