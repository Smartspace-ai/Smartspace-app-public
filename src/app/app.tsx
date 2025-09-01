// src/app/app.tsx
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import { SidebarProvider } from '@/components/ui/sidebar'
import { TeamsProvider, useTeams } from '@/contexts/teams-context'
import { SignalRProvider } from '@/hooks/use-signalr'
import { Loader2 } from 'lucide-react'

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
  )

  return (
    <TeamsProvider>
      <InnerProviders queryClient={queryClient}>{children}</InnerProviders>
    </TeamsProvider>
  )
}

function InnerProviders({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
  const { instance } = useMsal()
  const { isInTeams, isTeamsInitialized } = useTeams()
  useIsAuthenticated()

  // Ensure an MSAL active account is set
  useEffect(() => {
    const current = instance.getActiveAccount()
    const all = instance.getAllAccounts()
    if (!current && all.length > 0) {
      instance.setActiveAccount(all[0])
    }
  }, [instance])

  // If running inside Teams, wait for Teams init before rendering
  if (isInTeams && !isTeamsInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider defaultRightOpen>
        <SignalRProvider>
          {children}
        </SignalRProvider>
      </SidebarProvider>
    </QueryClientProvider>
  )
}

export default AppProviders
