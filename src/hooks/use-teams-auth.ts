import { useMsal } from '@azure/msal-react';
// Teams SDK popup flow is abstracted in utils/teams-auth
import { useCallback, useState } from 'react';

import { performTeamsInteractiveAuth } from '@/utils/teams-auth';
import { teamsLoginRequest } from '../app/msalConfig';
import { useTeams } from '../contexts/teams-context';

export const useTeamsAuth = () => {
  const { instance, accounts } = useMsal();
  const { isInTeams: inTeams, isTeamsInitialized, teamsUser } = useTeams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async () => {    
    setIsLoading(true);
    setError(null);

    if (inTeams && isTeamsInitialized) {   
      try {   
        const loginHint = teamsUser?.loginHint;

        // Try Teams SSO first with consent prompt if needed
        try {
          await instance.ssoSilent({
            ...teamsLoginRequest,
            prompt: 'none',
            loginHint,
          });

          return; // Success - exit early
        } catch (ssoError) {
          console.log('SSO failed, trying Teams authentication popup with consent:', ssoError);

          await performTeamsInteractiveAuth(instance, loginHint);

          return; // Success - exit early
        }
      } catch (authError) {
        console.error('Authentication failed:', authError);
        const errorMessage = authError instanceof Error ? authError.message : 'Authentication failed';
        setError(errorMessage);
        throw authError; // Re-throw so calling component can handle it
      } finally {
        setIsLoading(false);
      }
    }
  }, [instance, inTeams, isTeamsInitialized, teamsUser]);
  
  // helpers moved to utils/teams-auth


  return {
    login,
    isLoading,
    error,
    isInTeams: inTeams,
  };
}; 
