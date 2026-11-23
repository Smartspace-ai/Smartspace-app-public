// src/app/AppProviders.tsx
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useMemo } from 'react';

import { AuthProvider, useAuth } from '@/platform/auth/session';
import { sessionQueryOptions } from '@/platform/auth/sessionQuery';
import { queryClient as defaultQueryClient } from '@/platform/reactQueryClient';
import { RealtimeProvider } from '@/platform/realtime/RealtimeProvider';

import { SessionExpiryPrompt } from '@/app/ui/SessionExpiryPrompt';

import { createMuiTheme } from '@/shared/ui/mui-bridge/theme';
import { SidebarProvider } from '@/shared/ui/mui-compat/sidebar';

import { useColorScheme } from '@/theme/colorScheme';

import { TeamsProvider } from './providers';

/** Keeps MUI's palette mode in step with the `dark` class on `<html>`. */
function MuiThemeBridge({ children }: { children: ReactNode }) {
  const { scheme } = useColorScheme();
  const theme = useMemo(() => createMuiTheme(scheme), [scheme]);
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  );
}

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

// `queryClient` must be the router context's client, so loaders and
// components share one cache. A spec can pass its own.
export default function AppProviders({
  children,
  queryClient = defaultQueryClient,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  return (
    <TeamsProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SessionExpiryPrompt />
          <RealtimeBridge>
            <MuiThemeBridge>
              {/* The comments rail starts closed and opens from the header's
                  comments button, the way the design presents it. */}
              <SidebarProvider>{children}</SidebarProvider>
            </MuiThemeBridge>
          </RealtimeBridge>
        </AuthProvider>
        {import.meta.env.DEV ? (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-left" />
        ) : null}
      </QueryClientProvider>
    </TeamsProvider>
  );
}
