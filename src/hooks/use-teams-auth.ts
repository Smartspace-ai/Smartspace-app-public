import { useMsal } from '@azure/msal-react';
import { authentication } from '@microsoft/teams-js';
import { useCallback, useState } from 'react';

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

          await authentication.authenticate({
            url: await buildAuthUrl(loginHint),
            width: 480,
            height: 650
          });

          await instance.ssoSilent({
            ...teamsLoginRequest,
            prompt: 'none',
            loginHint,
          });

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
  
  // Helper function to build the authentication URL for Teams
  const buildAuthUrl = async (loginHint: string | undefined) => {
    const clientId = import.meta.env.VITE_CLIENT_ID;
    const tenantId = import.meta.env.VITE_CLIENT_AUTHORITY?.split('/').pop() || 'common';
    // Use a dedicated callback route for Teams auth
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/teams/callback`);
    const scopes = encodeURIComponent(teamsLoginRequest.scopes?.join(' ') || '');

    // PKCE: generate code_verifier and code_challenge
    const codeVerifier = generateRandomString();
    const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
    localStorage.setItem('pkce_code_verifier', codeVerifier);

    let url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scopes}&` +
      `response_mode=fragment&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`;

    // Add login hint if available
    if (loginHint) {
      url += `&login_hint=${encodeURIComponent(loginHint)}`;
    }

    return url;
  };

  // Helper to generate a random string for PKCE
  function generateRandomString(length = 43) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < values.length; i++) {
      result += charset[values[i] % charset.length];
    }
    return result;
  }

  // Helper to generate PKCE code_challenge from code_verifier
  async function pkceChallengeFromVerifier(verifier: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }


  return {
    login,
    isLoading,
    error,
    isInTeams: inTeams,
  };
}; 
