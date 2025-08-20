import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { SidebarProvider } from '../components/ui/sidebar';
import { NotificationsProvider } from '../contexts/notifications-context';
import { useTeams } from '../contexts/teams-context';

import TeamsAuthCallback from '@/pages/auth/teams/callback';
import { Loader2 } from 'lucide-react';
import { SignalRProvider } from '../hooks/use-signalr';
import Login from '../pages/Login/Login';
import AppRoutes from '../routes/app-routes';

export function App() {
  const { instance } = useMsal();
  const { isInTeams, isTeamsInitialized, teamsUser } = useTeams();
  const [isMSALInitialized, setIsMSALInitialized] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false, // Disable auto-refetch on window focus
            retry: false,
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

  // Removed aggressive logout redirect to avoid loops in Teams (esp. mobile)

  const isAuthenticated = useIsAuthenticated();

  // Defensive: If in Teams, only render after both MSAL and Teams are initialized
  if (!isMSALInitialized || (isInTeams && !isTeamsInitialized)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', backgroundColor: 'white' }}>
      {isAuthenticated ? (
        <QueryClientProvider client={queryClient}>
          <SidebarProvider>
          <NotificationsProvider>
              {/* Route-based app navigation */}
              <BrowserRouter>
              <SignalRProvider>
                <AppRoutes />
              </SignalRProvider>
              </BrowserRouter>
          </NotificationsProvider>
          </SidebarProvider>
      </QueryClientProvider>
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/auth/teams/callback" element={<TeamsAuthCallback />} />
            <Route path="*" element={<Login />} />
          </Routes>
        </BrowserRouter>
      )}
    </div>
  );
}

export default App;
