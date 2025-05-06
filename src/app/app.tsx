import { useMsal } from '@azure/msal-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { SidebarProvider } from '../components/ui/sidebar';
import { NotificationsProvider } from '../contexts/notifications-context';
import { SmartSpaceChatProvider } from '../contexts/smartspace-context';
import { UserContext, useUserInformation } from '../hooks/use-user-information';
import { msalInstance } from '../main';

import { Loader2 } from 'lucide-react';
import Login from '../pages/Login/Login';
import AppRoutes from '../routes/app-routes';

export function App() {
  const { instance, accounts } = useMsal();
  const [isMSALInitialized, setIsMSALInitialized] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false, // Disable auto-refetch on window focus
          },
        },
      })
  );

  useEffect(() => {
    // On initial mount, set the first available account as active
    const current = instance.getActiveAccount();
    const all = instance.getAllAccounts();

    if (!current && all.length > 0) {
      instance.setActiveAccount(all[0]);
    }

    setIsMSALInitialized(true);
  }, [instance, isMSALInitialized]);

  const { graphData, graphPhoto } = useUserInformation({ msalInstance });

  if (!isMSALInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isAuthenticated = accounts.length > 0;

  return (
    <div style={{ height: '100%', width: '100%' }}>
      {isAuthenticated ? (
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
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;
