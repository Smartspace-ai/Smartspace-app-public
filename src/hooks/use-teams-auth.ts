import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { app, authentication } from '@microsoft/teams-js';
import { useCallback, useState } from 'react';

import { getTeamsTokenWithRetry } from '@/utils/getTeamsToken';
import { teamsLoginRequest } from '../app/msalConfig';
import { useTeams } from '../contexts/teams-context';

export const useTeamsAuth = () => {
  const { instance } = useMsal();
  const { isInTeams: inTeams, isTeamsInitialized, teamsUser } = useTeams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(async () => {    
    // Prevent re-entrancy/loops
    if (isLoading || isAuthenticated) {
      return;
    }
    setIsLoading(true);
    setError(null);

    if (inTeams && isTeamsInitialized) {   
      try {   
        const loginHint = teamsUser?.loginHint;

        // Try Teams SSO silently via MSAL
        try {
          await instance.ssoSilent({
            ...teamsLoginRequest,
            prompt: 'none',
            loginHint,
          });

          setIsAuthenticated(true);
          return; // Success - exit early
        } catch (ssoError) {
          // Fallback: Use Teams SDK token for mobile-specific SSO
          try {
            await app.initialize();
          } catch (_initErr) {
            // ignore initialization errors; getAuthToken may still surface useful errors
          }

          try {
            // Use retry for flaky mobile environments
            const token = await getTeamsTokenWithRetry(3, 800)
            if (!token) {
              throw ssoError
            }
            setIsAuthenticated(true);
          } catch (teamsError: unknown) {
            // Fallback: Teams interactive auth via popup to our callback, then MSAL silent
            try {
              const baseUrl = `${window.location.origin}/auth/teams/callback`
              const url = loginHint ? `${baseUrl}?login_hint=${encodeURIComponent(loginHint)}` : baseUrl
              await authentication.authenticate({ url, width: 480, height: 650 })

              await instance.ssoSilent({
                ...teamsLoginRequest,
                prompt: 'none',
                loginHint,
              })
              setIsAuthenticated(true)
              return
            } catch (interactiveErr) {
              throw new Error(
                `Teams getAuthToken failed: ${formatAuthError(teamsError)} | Interactive failed: ${formatAuthError(interactiveErr)}`
              )
            }
          }

          // If your API uses MSAL tokens, you might need an OBO exchange here.
          // For now, presence of a token indicates user is authenticated in Teams.
          return;
        }
      } catch (authError) {
        console.error('Authentication failed:', authError);
        setError(formatAuthError(authError));
        throw authError; // Re-throw so calling component can handle it
      } finally {
        setIsLoading(false);
      }
    }
  }, [instance, inTeams, isTeamsInitialized, teamsUser, isLoading, isAuthenticated]);
  
  function formatAuthError(err: unknown): string {
    try {
      // MSAL error types
      if (err instanceof InteractionRequiredAuthError) {
        return `MSAL InteractionRequired: ${err.errorCode || ''} ${err.subError || ''}`.trim();
      }
      if (err && typeof err === 'object') {
        const anyErr = err as Record<string, unknown>;
        const parts: string[] = [];
        if (anyErr.name) parts.push(String(anyErr.name));
        if (anyErr.errorMessage) parts.push(String(anyErr.errorMessage));
        if (anyErr.errorCode) parts.push(String(anyErr.errorCode));
        if (anyErr.subError) parts.push(String(anyErr.subError));
        if (anyErr.message) parts.push(String(anyErr.message));
        if (anyErr.stack) parts.push('stack');
        const msg = parts.filter(Boolean).join(' | ');
        return msg || JSON.stringify(anyErr) || 'Authentication failed';
      }
      if (typeof err === 'string') return err;
      return 'Authentication failed';
    } catch {
      return 'Authentication failed';
    }
  }
  
  return {
    login,
    isLoading,
    error,
    isInTeams: inTeams,
    isAuthenticated,
  };
}; 
