import { useEffect, useState } from 'react';
import styles from '../../Login/Login.module.scss';

import { teamsLoginRequest } from '@/app/msalConfig';
import { app, authentication } from '@microsoft/teams-js';

const TeamsAuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    const handleAuth = async () => {
      try {
        // Ensure Teams auth APIs are initialized (required on Teams mobile)
        try {
          await app.initialize();
        } catch {
          // ignore if already initialized or not required
        }
        // Extract code or error from URL fragment or query
        const params = new URLSearchParams(window.location.hash.substring(1) || window.location.search.substring(1));
        const code = params.get('code');
        const error = params.get('error');
        const error_description = params.get('error_description')
        const login_hint = params.get('login_hint') || undefined;
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
        // No code yet: kick off the authorize flow with PKCE from this popup
        const clientId = import.meta.env.VITE_CLIENT_ID;
        const tenantId = import.meta.env.VITE_CLIENT_AUTHORITY?.split('/').pop() || 'common';
        const redirectUri = encodeURIComponent(`${window.location.origin}/auth/teams/callback`);
        const scopes = encodeURIComponent(teamsLoginRequest.scopes?.join(' ') || '');

        const codeVerifier = generateRandomString();
        const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
        localStorage.setItem('pkce_code_verifier', codeVerifier);

        let authorizeUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
          `client_id=${clientId}&` +
          `response_type=code&` +
          `redirect_uri=${redirectUri}&` +
          `scope=${scopes}&` +
          `response_mode=fragment&` +
          `code_challenge=${codeChallenge}&` +
          `code_challenge_method=S256`;

        if (login_hint) {
          authorizeUrl += `&login_hint=${encodeURIComponent(login_hint)}`;
        }

        window.location.replace(authorizeUrl);
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

export default TeamsAuthCallback; 