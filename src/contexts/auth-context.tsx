import React, { createContext, useContext, useMemo } from 'react'

import { useTeams } from '@/contexts/teams-context'
import { interactiveLoginRequest, loginRequest } from '@/platform/auth/msalConfig'
import { acquireNaaToken } from '@/platform/auth/naaClient'
import { useTeamsAuth } from '@/platform/auth/use-teams-auth'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'

type AuthContextValue = {
  isInTeams: boolean
  isAuthenticated: boolean
  login: () => Promise<void>
  getAccessToken: (scopes: string[]) => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isInTeams, isTeamsInitialized, teamsUser } = useTeams()
  const { instance, inProgress } = useMsal()
  const msalIsAuthenticated = useIsAuthenticated()
  const { login: teamsLogin } = useTeamsAuth()

  const value = useMemo<AuthContextValue>(() => {
    const teamsTokenPresent = (() => {
      try { return !!sessionStorage.getItem('teamsAuthToken') } catch { return false }
    })()

    const isTeamsAuthed = isInTeams && (teamsTokenPresent || (!!teamsUser && isTeamsInitialized))

    const login = async () => {
      if (isInTeams) {
        await teamsLogin()
        return
      }
      await instance.loginRedirect({ ...interactiveLoginRequest })
    }

    const getAccessToken = async (scopes: string[]) => {
      try {
        if (isInTeams) {
          const token = await acquireNaaToken(scopes)
          return token ?? null
        }
        const res = await instance.acquireTokenSilent({ ...loginRequest, scopes })
        return res.accessToken
      } catch {
        return null
      }
    }

    return {
      isInTeams,
      isAuthenticated: isTeamsAuthed || msalIsAuthenticated,
      login,
      getAccessToken,
    }
  }, [isInTeams, isTeamsInitialized, teamsUser, teamsLogin, instance, msalIsAuthenticated, inProgress])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider


