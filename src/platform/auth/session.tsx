import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

import { getAuthAdapter } from './index';
import { getAuthRuntimeState, subscribeAuthRuntime } from './runtime';
import { SESSION_QUERY_KEY, sessionQueryOptions } from './sessionQuery';
import type { AuthAdapter } from './types';

const AuthCtx = createContext<AuthAdapter | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const runtime = useSyncExternalStore(
    subscribeAuthRuntime,
    getAuthRuntimeState,
    getAuthRuntimeState
  );
  const qc = useQueryClient();

  // Singleton adapter — getAuthAdapter() returns cached instance keyed by runtime state
  const adapter = useMemo(
    () => getAuthAdapter(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runtime.isInTeams/isGuestUser trigger adapter re-evaluation
    [runtime.isInTeams, runtime.isGuestUser]
  );

  // When runtime state changes (Teams detected, guest detected), invalidate session
  // so it re-fetches with the correct adapter
  useEffect(() => {
    qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
  }, [runtime.isInTeams, runtime.isGuestUser, qc]);

  return <AuthCtx.Provider value={adapter}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

/**
 * Session state backed by React Query — cached, deduped, and invalidatable.
 * Replaces the old useEffect-based session fetch.
 */
export function useAuthSession() {
  const adapter = useAuth();
  const { data: session = null, isLoading: loading } = useQuery(
    sessionQueryOptions()
  );
  return { adapter, session, loading };
}

export function useUserId() {
  const { data: session } = useQuery(sessionQueryOptions());
  return session?.accountId ?? 'anonymous';
}

export function useUserDisplayName() {
  const { data: session } = useQuery(sessionQueryOptions());
  return session?.displayName ?? 'You';
}

export function useAuthRuntime() {
  return useSyncExternalStore(
    subscribeAuthRuntime,
    getAuthRuntimeState,
    getAuthRuntimeState
  );
}
