// src/app/app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';

import { SidebarProvider } from '@/components/ui/sidebar';
import { TeamsProvider, useTeams } from '@/contexts/teams-context';
import { SignalRProvider } from '@/hooks/use-signalr';
import { AuthProvider } from '@/platform/auth/session';
import { Loader2 } from 'lucide-react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
            refetchOnReconnect: false,
            staleTime: 30_000,
          },
        },
      }),
    []
  );

  return (
    <TeamsProvider>
      <InnerProviders queryClient={queryClient}>{children}</InnerProviders>
    </TeamsProvider>
  );
}

function InnerProviders({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  const { isInTeams, isTeamsInitialized } = useTeams();

  // If running inside Teams, wait for Teams init before rendering
  if (isInTeams && !isTeamsInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* Unified auth adapter (MSAL Web vs Teams NAA) lives here */}
      <AuthProvider>
        <SidebarProvider defaultRightOpen>
          <SignalRProvider>{children}</SignalRProvider>
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
