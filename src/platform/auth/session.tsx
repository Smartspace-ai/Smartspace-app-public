import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { createAuthAdapter, type AdapterMode } from './index';
import type { AuthAdapter } from './types';

type AuthContextValue = {
  adapter: AuthAdapter;
  session: { accountId?: string; displayName?: string } | null;
  loading: boolean;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

type Props = { children: ReactNode; mode?: AdapterMode };

export function AuthProvider({ children, mode = 'auto' }: Props) {
  const [adapter] = useState(() => createAuthAdapter(mode));
  const [session, setSession] = useState<AuthContextValue['session']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    adapter.getSession().then((s) => {
      if (mounted) {
        setSession(s);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [adapter]);

  return (
    <AuthCtx.Provider value={{ adapter, session, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function useUserId() {
  const { session } = useAuth();
  return session?.accountId ?? 'anonymous';
}

export function useUserDisplayName() {
  const { session } = useAuth();
  return session?.displayName ?? 'You';
}