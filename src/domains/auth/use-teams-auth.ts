import { app } from '@microsoft/teams-js';
import { useCallback, useState } from 'react';

import { useTeams } from '@/contexts/teams-context';
import { acquireNaaToken } from '@/domains/auth/naaClient';

export const useTeamsAuth = () => {
  const { isInTeams: inTeams, isTeamsInitialized, teamsUser } = useTeams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastAttemptAt, setLastAttemptAt] = useState<number>(0);
  const [teamsToken, setTeamsToken] = useState<string | null>(null);

  const login = useCallback(async () => {    
    if (isLoading || isAuthenticated) {
      return;
    }
    const now = Date.now();
    if (now - lastAttemptAt < 2000) {
      return;
    }
    setLastAttemptAt(now);
    setIsLoading(true);
    setError(null);

    if (inTeams && isTeamsInitialized) {   
      try {   
        const redirectAfterAuth = () => {
          try {
            const key = 'teamsAuthRedirected'
            if (sessionStorage.getItem(key) === '1') return
            sessionStorage.setItem(key, '1')
            const redirectParam = new URLSearchParams(window.location.search).get('redirect') ?? '/_protected/workspace'
            const url = new URL(redirectParam, window.location.origin)
            sessionStorage.setItem('teamsAuthRedirectUrl', url.toString())
            window.location.replace(url.toString())
          } catch (_e) {}
        }

        try { await app.initialize(); } catch (_e) {}

        const resourceAppId = 'e3f39d90-9235-435e-ba49-681727352613'
        const scopes = [`api://${window.location.host}/${resourceAppId}/smartspaceapi.chat.access`]
        const token = await acquireNaaToken(scopes)
        setTeamsToken(token)
        setIsAuthenticated(true)
        redirectAfterAuth()
        return
      } catch (authError) {
        console.error('Authentication failed:', authError);
        setError(authError instanceof Error ? authError.message : 'Authentication failed');
        throw authError;
      } finally {
        setIsLoading(false);
      }
    }
  }, [inTeams, isTeamsInitialized, teamsUser, isLoading, isAuthenticated, lastAttemptAt]);
  
  return {
    login,
    isLoading,
    error,
    isInTeams: inTeams,
    isAuthenticated,
    teamsToken,
  };
}; 


