import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { createMsalWebAdapter } from './providers/msalWeb';
import { createTeamsNaaAdapter } from './providers/teamsNaa';
import type { AuthAdapter } from './types';
import { isInTeams } from './utils';

type AdapterMode = 'auto' | 'web' | 'teams';

type AuthContextValue = {
  adapter: AuthAdapter;
  session: { accountId?: string; displayName?: string } | null;
  loading: boolean;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

function pickAdapter(mode: AdapterMode): AuthAdapter {
  const factory =
    mode === 'teams' || (mode === 'auto' && isInTeams())
      ? createTeamsNaaAdapter
      : createMsalWebAdapter;
  return factory();
}

type Props = { children: ReactNode; mode?: AdapterMode };

export function AuthProvider({ children, mode = 'auto' }: Props) {
  const [adapter] = useState(() => pickAdapter(mode));
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
