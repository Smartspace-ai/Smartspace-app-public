/**
 * Entry point for the Teams SDK authentication popup (end/callback page).
 *
 * Azure AD redirects here after the user authenticates. This script calls
 * `handleRedirectPromise()` to extract the auth result (which writes tokens
 * to localStorage, shared with the main app). Then it calls
 * `authentication.notifySuccess()` to close the popup and return control
 * to the main app.
 */
import { PublicClientApplication } from '@azure/msal-browser';
import { authentication, app as teamsApp } from '@microsoft/teams-js';

import { msalConfig } from '@/platform/auth/msalConfig';

const statusEl = document.getElementById('status');

function setStatus(msg: string) {
  if (statusEl) statusEl.textContent = msg;
}

(async () => {
  try {
    // Initialize Teams SDK — required before calling notifySuccess/notifyFailure.
    await teamsApp.initialize();

    const msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    setStatus('Processing sign-in response...');

    // handleRedirectPromise() parses the auth response from the URL,
    // validates it, and caches tokens + account in localStorage.
    const result = await msalInstance.handleRedirectPromise();

    if (result?.account) {
      // Pass homeAccountId back so the main app can set it as the active account.
      // We do NOT pass the actual token via notifySuccess (security best practice).
      // The main app reads tokens from the shared localStorage cache.
      authentication.notifySuccess(result.account.homeAccountId);
    } else {
      authentication.notifyFailure('No authentication result received.');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setStatus(`Sign-in failed: ${message}`);

    try {
      authentication.notifyFailure(message);
    } catch {
      // If notifyFailure itself fails, popup stays open for user to close.
    }
  }
})();
