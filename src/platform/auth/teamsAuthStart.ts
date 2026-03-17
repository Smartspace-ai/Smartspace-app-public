/**
 * Entry point for the Teams SDK authentication popup (start page).
 *
 * Opened by `authentication.authenticate({ url: '/teams-auth-start.html' })`
 * from the main app. Initializes MSAL and calls `loginRedirect()` which
 * navigates the popup to Azure AD. After authentication, Azure AD redirects
 * back to `/teams-auth-end.html` (TEAMS_AUTH_REDIRECT_URI).
 */
import { PublicClientApplication } from '@azure/msal-browser';

import {
  interactiveLoginRequest,
  msalConfig,
  TEAMS_AUTH_REDIRECT_URI,
} from '@/platform/auth/msalConfig';

const statusEl = document.getElementById('status');

function setStatus(msg: string) {
  if (statusEl) statusEl.textContent = msg;
}

(async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const loginHint = params.get('loginHint') ?? undefined;

    const msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    setStatus('Redirecting to Microsoft sign-in...');

    // Use loginRedirect (not popup) because we ARE the popup.
    // Azure AD will redirect back to TEAMS_AUTH_REDIRECT_URI after auth.
    await msalInstance.loginRedirect({
      ...interactiveLoginRequest,
      redirectUri: TEAMS_AUTH_REDIRECT_URI,
      ...(loginHint ? { loginHint } : {}),
    });
    // loginRedirect navigates away; code below is never reached.
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setStatus(`Sign-in failed: ${message}`);

    try {
      const { authentication } = await import('@microsoft/teams-js');
      authentication.notifyFailure(message);
    } catch {
      // Teams SDK not available; popup shows error text.
    }
  }
})();
