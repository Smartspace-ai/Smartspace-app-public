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

import { loginRequest, msalConfig } from '@/platform/auth/msalConfig';
import { getApiScopes } from '@/platform/auth/scopes';

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
      msalInstance.setActiveAccount(result.account);

      // The login result's accessToken may target Microsoft Graph when mixed
      // scopes (API + openid/profile) were requested. Explicitly acquire a
      // token scoped to the SmartSpace API.
      let apiAccessToken = result.accessToken;
      let apiExpiresOn = result.expiresOn;

      const apiScopes = getApiScopes();
      if (apiScopes.length > 0) {
        try {
          const apiResult = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            scopes: apiScopes,
            account: result.account,
          });
          apiAccessToken = apiResult.accessToken;
          apiExpiresOn = apiResult.expiresOn;
        } catch {
          // Fall back to the login result's token
        }
      }

      const payload = JSON.stringify({
        homeAccountId: result.account.homeAccountId,
        accessToken: apiAccessToken,
        expiresOn: apiExpiresOn?.toISOString() ?? null,
      });
      authentication.notifySuccess(payload);
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
