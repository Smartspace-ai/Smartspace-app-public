// src/app/AppProviders.tsx
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/platform/auth/session';
import { sessionQueryOptions } from '@/platform/auth/sessionQuery';
import { queryClient } from '@/platform/reactQueryClient';
import { RealtimeProvider } from '@/platform/realtime/RealtimeProvider';

import { muiTheme } from '@/shared/ui/mui-bridge/theme';
import { SidebarProvider } from '@/shared/ui/mui-compat/sidebar';

import { TeamsProvider } from './providers';

function RealtimeBridge({ children }: { children: ReactNode }) {
  const adapter = useAuth();
  const { data: session, isLoading } = useQuery(sessionQueryOptions());
  const getAccessToken = (scopes?: string[]) =>
    adapter.getAccessToken({ scopes, silentOnly: true });
  // Mount realtime only when a session exists to avoid negotiate loops
  if (isLoading || !session) return children;
  return (
    <RealtimeProvider getAccessToken={getAccessToken}>
      {children}
    </RealtimeProvider>
  );
}

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TeamsProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RealtimeBridge>
            <StyledEngineProvider injectFirst>
              <ThemeProvider theme={muiTheme}>
                <SidebarProvider defaultRightOpen>{children}</SidebarProvider>
              </ThemeProvider>
            </StyledEngineProvider>
          </RealtimeBridge>
        </AuthProvider>
        {import.meta.env.DEV ? (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-left" />
        ) : null}
      </QueryClientProvider>
    </TeamsProvider>
  );
}
