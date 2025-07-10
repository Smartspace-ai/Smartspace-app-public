import { useEffect, useState } from 'react';
import styles from '../../Login/Login.module.scss';

// Only import Teams SDK dynamically to avoid SSR issues
import { authentication } from '@microsoft/teams-js';

const TeamsAuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    const handleAuth = async () => {
      try {
        // Extract code or error from URL fragment or query
        const params = new URLSearchParams(window.location.hash.substring(1) || window.location.search.substring(1));
        const code = params.get('code');
        const error = params.get('error');
        const error_description = params.get('error_description')
        if (error_description) {
          setError(error_description);
          return;
        }

        if (code) {
          // PKCE: get code_verifier from sessionStorage
          const codeVerifier = localStorage.getItem('pkce_code_verifier');
          if (!codeVerifier) {
            setError('Missing PKCE code_verifier.');
            authentication.notifyFailure('Missing PKCE code_verifier.');
            return;
          }
          // Exchange code for tokens
          const clientId = import.meta.env.VITE_CLIENT_ID;
          const tenantId = import.meta.env.VITE_CLIENT_AUTHORITY?.split('/').pop() || 'common';
          const redirectUri = `${window.location.origin}/auth/teams/callback`;
          const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
          const body = new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
          });
          try {
            const resp = await fetch(tokenUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: body.toString(),
            });
            const data = await resp.json();
            if (resp.ok && data.access_token) {
              authentication.notifySuccess();
            } else {
              setError(data.error_description || 'Token exchange failed.');
              authentication.notifyFailure(data.error_description || 'Token exchange failed.');
            }
          } catch (err: any) {
            setError(err.message || 'Token exchange failed.');
            authentication.notifyFailure(err.message || 'Token exchange failed.');
          }
          return;
        }
        return;

      } catch (err) {
        authentication.notifyFailure((err as Error).message || 'Unknown error');
      }
    };

    handleAuth();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className={`ss-login ${styles['container']}`}>
      {/* Full-screen centered container with light gray background */}
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {/* Card container for the login form */}
        <div style={{minHeight: '200px'}} className="flex flex-col justify-center items-center p-8 bg-white shadow-md rounded-lg min-w-[300px] max-w-[400px]">
          <div >Completing Teams authentication…</div>
          <br />
          <div style={{color: 'red'}}>{error}</div>
        </div>
      </div>
    </div>
  );
};

export default TeamsAuthCallback; 