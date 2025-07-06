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
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  const login = useCallback(async () => {
    if (retryCount >= MAX_RETRIES) {
      console.log('❌ Max retries reached, stopping attempts');
      setError('Maximum authentication attempts reached. Please refresh the page or contact support.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);

    try {
      if (inTeams && isTeamsInitialized) {
        // Try Teams SSO first
        try {
          const authToken = await authentication.getAuthToken();
          
          await instance.ssoSilent(teamsLoginRequest);
        } catch (ssoError) {
          await instance.loginPopup(teamsLoginRequest);
        }
      } else {
        // Regular browser authentication
        await instance.loginPopup(loginRequest);
      }
    } catch (authError) {
      console.error('Authentication failed:', authError);
      const errorMessage = authError instanceof Error ? authError.message : 'Authentication failed';
      setError(`${errorMessage}${retryCount < MAX_RETRIES ? ' (Will retry)' : ' (Max retries reached)'}`);
    } finally {
      setIsLoading(false);
    }
  }, [instance, inTeams, isTeamsInitialized, retryCount, MAX_RETRIES]);

  const resetRetryCount = useCallback(() => {
    console.log('🔄 Resetting retry count');
    setRetryCount(0);
    setError(null);
  }, []);

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
      setError(logoutError instanceof Error ? logoutError.message : 'Logout failed');
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
    resetRetryCount,
    retryCount,
  };
}; 