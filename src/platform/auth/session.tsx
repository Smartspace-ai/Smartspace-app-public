import React, { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { createAuthAdapter } from './index';
import type { AuthAdapter } from './types';
import { getAuthRuntimeState, subscribeAuthRuntime } from './runtime';

const AuthCtx = createContext<AuthAdapter | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const adapter = useMemo(() => createAuthAdapter(), []);
  return <AuthCtx.Provider value={adapter}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

/**
 * Lightweight session helper on top of the main-branch auth adapter.
 * This keeps the auth implementation aligned with `main` while preserving
 * existing app code that needs a cached session/user display name.
 */
export function useAuthSession() {
  const adapter = useAuth();
  const [session, setSession] = useState<{ accountId?: string; displayName?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adapter.getSession()
      .then((s) => { if (mounted) setSession(s); })
      .catch(() => { if (mounted) setSession(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [adapter]);

  return { adapter, session, loading };
}

export function useUserId() {
  const { session } = useAuthSession();
  return session?.accountId ?? 'anonymous';
}

export function useUserDisplayName() {
  const { session } = useAuthSession();
  return session?.displayName ?? 'You';
}

export function useAuthRuntime() {
  return useSyncExternalStore(subscribeAuthRuntime, getAuthRuntimeState, getAuthRuntimeState);
}
