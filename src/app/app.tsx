// src/app/app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import { AuthProvider } from '@/platform/auth/session';

import { SidebarProvider } from '@/shared/ui/shadcn/sidebar';

import { TeamsProvider, useTeams } from '@/contexts/teams-context';
import { SignalRProvider } from '@/hooks/use-signalr';

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
      {/* {import.meta.env.DEV && ( */}
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-left" />

      {/* )} */}
    </QueryClientProvider>
  );
}

export default AppProviders;
