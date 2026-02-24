/**
 * Shared helpers for the Teams SDK authentication popup flow.
 *
 * Used by both MsalWebAdapter and TeamsNaaAdapter to replace
 * `loginPopup()` / `acquireTokenPopup()` with the Teams SDK
 * `authentication.authenticate()` API, which bypasses WebView2
 * popup blocking in Teams Desktop.
 */
import type { PublicClientApplication } from '@azure/msal-browser';
import { authentication, app as teamsApp } from '@microsoft/teams-js';

import { ssInfo, ssWarn } from '@/platform/log';

/**
 * Opens the Teams SDK authentication popup to perform MSAL loginRedirect
 * inside a Teams-controlled window (bypasses WebView2 popup blocking).
 *
 * After success, the main app's MSAL instance can find the new account
 * in localStorage (shared origin, same MSAL cache).
 *
 * @returns The homeAccountId string from the popup's notifySuccess call.
 */
export async function authenticateViaTeamsSdk(
  loginHint?: string
): Promise<string> {
  // Ensure Teams SDK is initialized (TeamsProvider usually does this,
  // but be defensive in case this runs before the provider).
  try {
    await teamsApp.initialize();
  } catch {
    // May already be initialized; ignore.
  }

  const url = loginHint
    ? `${
        window.location.origin
      }/teams-auth-start.html?loginHint=${encodeURIComponent(loginHint)}`
    : `${window.location.origin}/teams-auth-start.html`;

  ssInfo(
    'auth:teams-helper',
    'authenticateViaTeamsSdk -> opening Teams auth popup',
    {
      url,
      hasLoginHint: !!loginHint,
    }
  );

  const homeAccountId = await authentication.authenticate({
    url,
    width: 600,
    height: 535,
  });

  ssInfo('auth:teams-helper', 'Teams auth popup succeeded', { homeAccountId });
  return homeAccountId;
}

/**
 * After the Teams auth popup completes, look up the account that was
 * cached by the popup's MSAL instance and set it as active in the
 * main app's MSAL instance.
 *
 * Works because both windows share localStorage (same origin) and
 * MSAL reads from the cache store on each `getAllAccounts()` call.
 */
export function setActiveAccountFromTeamsAuth(
  msalInstance: PublicClientApplication,
  homeAccountId: string
): void {
  const allAccounts = msalInstance.getAllAccounts();
  const matchingAccount = allAccounts.find(
    (a) => a.homeAccountId === homeAccountId
  );

  if (matchingAccount) {
    msalInstance.setActiveAccount(matchingAccount);
    ssInfo('auth:teams-helper', 'Account found and activated', {
      homeAccountId,
    });
  } else {
    ssWarn(
      'auth:teams-helper',
      'Exact account match not found, using first available',
      {
        homeAccountId,
        availableAccounts: allAccounts.length,
      }
    );
    if (allAccounts.length > 0) {
      msalInstance.setActiveAccount(allAccounts[0]);
    }
  }
}
