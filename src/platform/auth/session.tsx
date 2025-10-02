'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

import { createAuthAdapter } from './index'
import type { AuthAdapter } from './types'

type AuthContextType = {
  adapter: AuthAdapter
  session: { accountId?: string; displayName?: string } | null
  loading: boolean
}

const AuthCtx = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [adapter] = useState(() => createAuthAdapter())
  const [session, setSession] = useState<{ accountId?: string; displayName?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adapter.getSession().then(s => {
      setSession(s ?? null)
      setLoading(false)
    })
  }, [adapter])

  return (
    <AuthCtx.Provider value={{ adapter, session, loading }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

// Convenience selectors
export function useUserId() {
  const { session } = useAuth()
  return session?.accountId ?? 'anonymous'
}
