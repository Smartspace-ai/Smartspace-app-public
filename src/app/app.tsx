// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { SidebarProvider } from '../components/ui/sidebar';
import { NotificationsProvider } from '../contexts/notifications-context';
import { SmartSpaceChatProvider } from '../contexts/smartspace-context';
import { UserContext, useUserInformation } from '../hooks/use-user-information';
import { msalInstance } from '../main';

import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '../routes/app-routes';

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    const current = msalInstance.getActiveAccount();
    const all = msalInstance.getAllAccounts();
    if (!current && all.length > 0) {
      msalInstance.setActiveAccount(all[0]);
    }
  }, []);

  const { graphData, graphPhoto } = useUserInformation({ msalInstance });

  return (
    <QueryClientProvider client={queryClient}>
      <UserContext.Provider value={{ graphData, graphPhoto }}>
        <SmartSpaceChatProvider>
          <NotificationsProvider>
            <SidebarProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </SidebarProvider>
          </NotificationsProvider>
        </SmartSpaceChatProvider>
      </UserContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
