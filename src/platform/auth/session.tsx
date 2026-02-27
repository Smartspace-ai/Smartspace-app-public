'use client';
import React, { createContext, useContext, useMemo } from 'react';
import { createAuthAdapter } from './index';
import type { AuthAdapter } from './types';

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
