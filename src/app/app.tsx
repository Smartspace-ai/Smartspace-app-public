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
  // Instantiate react-query client with default config
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Cache queries for 1 minute
            refetchOnWindowFocus: false, // Disable auto-refetch on window focus
          },
        },
      })
  );

  useEffect(() => {
    // On initial mount, set the first available account as active
    const current = msalInstance.getActiveAccount();
    const all = msalInstance.getAllAccounts();

    if (!current && all.length > 0) {
      msalInstance.setActiveAccount(all[0]);
    }
  }, []);

  // Custom hook to fetch MS Graph user data & profile photo
  const { graphData, graphPhoto } = useUserInformation({ msalInstance });

  return (
    <QueryClientProvider client={queryClient}>
      {/* Provide user data via context for downstream consumers */}
      <UserContext.Provider value={{ graphData, graphPhoto }}>
        {/* App-wide providers for chat, notifications, and sidebar */}
        <SmartSpaceChatProvider>
          <NotificationsProvider>
            <SidebarProvider>
              {/* Route-based app navigation */}
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
