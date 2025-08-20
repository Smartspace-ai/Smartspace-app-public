import { teamsLoginRequest } from '@/app/msalConfig';
import { IPublicClientApplication } from '@azure/msal-browser';
import { authentication } from '@microsoft/teams-js';

// Builds the AAD authorize URL for Teams authenticate popup with PKCE
export async function buildTeamsAuthUrl(loginHint?: string): Promise<string> {
  const clientId = import.meta.env.VITE_CLIENT_ID as string;
  const tenantId = (import.meta.env.VITE_CLIENT_AUTHORITY as string)?.split('/')?.pop() || 'common';
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/teams/callback`);
  const scopes = encodeURIComponent(teamsLoginRequest.scopes?.join(' ') || 'openid profile');

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

  if (loginHint) {
    url += `&login_hint=${encodeURIComponent(loginHint)}`;
  }

  return url;
}

// Performs Teams popup auth and then completes MSAL SSO silently
export async function performTeamsInteractiveAuth(
  msalInstance: IPublicClientApplication,
  loginHint?: string
): Promise<void> {
  // Launch Teams-hosted auth popup
  await authentication.authenticate({
    url: await buildTeamsAuthUrl(loginHint),
    width: 480,
    height: 650,
  });

  // After popup completes, acquire tokens silently into MSAL cache
  await msalInstance.ssoSilent({
    ...teamsLoginRequest,
    prompt: 'none',
    loginHint,
  });
}

function generateRandomString(length = 43): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const values = new Uint8Array(length);
  window.crypto.getRandomValues(values);
  for (let i = 0; i < values.length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}

async function pkceChallengeFromVerifier(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}


