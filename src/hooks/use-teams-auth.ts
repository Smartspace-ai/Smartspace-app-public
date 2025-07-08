import { useMsal } from '@azure/msal-react';
import { authentication } from '@microsoft/teams-js';
import { useCallback, useState } from 'react';

import { loginRequest, teamsLoginRequest } from '../app/msalConfig';
import { useTeams } from '../contexts/teams-context';

export const useTeamsAuth = () => {
  const { instance, accounts } = useMsal();
  const { isInTeams: inTeams, isTeamsInitialized } = useTeams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async () => {    
    setIsLoading(true);
    setError(null);

    try {
      if (inTeams && isTeamsInitialized) {
        // Try Teams SSO first
        try {
          const authToken = await authentication.getAuthToken();
          const decoded = safeDecodeJwt(authToken);
          const loginHint = decoded.preferred_username;

          await instance.ssoSilent({
            ...teamsLoginRequest,
            loginHint,
          });
        } catch (ssoError) {
          setError(ssoError.toString())
          await instance.loginPopup(teamsLoginRequest);
        }
      } else {
        // TODO add some logs into state here
        // Regular browser authentication
        await instance.loginPopup(loginRequest);
      }
    } catch (authError) {
      console.error('Authentication failed:', authError);
      const errorMessage = authError instanceof Error ? authError.message : 'Authentication failed';
    } finally {
      setIsLoading(false);
    }
  }, [instance, inTeams, isTeamsInitialized]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (inTeams) {
        // In Teams, we might want to handle logout differently
        // For now, we'll just clear the MSAL cache
        const activeAccount = instance.getActiveAccount();
        if (activeAccount) {
          await instance.logout({
            account: activeAccount,
          });
        }
      } else {
        // Regular browser logout
        await instance.logoutPopup();
      }
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
      // setError(logoutError instanceof Error ? logoutError.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, [instance, inTeams]);

  const acquireTokenSilently = useCallback(async (scopes: string[]) => {
    const activeAccount = instance.getActiveAccount();
    if (!activeAccount) {
      throw new Error('No active account found');
    }

    try {
      const request = {
        scopes,
        account: activeAccount,
      };

      const response = await instance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      console.error('Silent token acquisition failed:', error);
      
      // If silent fails and we're in Teams, try popup
      if (inTeams) {
        const response = await instance.acquireTokenPopup({
          scopes,
          account: activeAccount,
        });
        return response.accessToken;
      }
      
      throw error;
    }
  }, [instance, inTeams]);

  return {
    isAuthenticated: accounts.length > 0,
    accounts,
    activeAccount: instance.getActiveAccount(),
    login,
    logout,
    acquireTokenSilently,
    isLoading,
    error,
    isInTeams: inTeams,
  };
}; 


function safeDecodeJwt(token?: string) {
  try {
    if (!token || token.split('.').length !== 3) {
      throw new Error('Token is not a valid JWT');
    }
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to decode JWT:', err);
    return null;
  }
}