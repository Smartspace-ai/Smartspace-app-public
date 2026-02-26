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
 * Result returned from the Teams SDK authentication popup.
 *
 * When the popup sends a JSON payload (new behavior), this includes the access
 * token directly — critical for Teams Mobile where localStorage is partitioned
 * and the main app cannot read the popup's MSAL cache.
 *
 * When the popup sends a plain homeAccountId string (legacy), only
 * `homeAccountId` is populated.
 */
export type TeamsAuthResult = {
  homeAccountId: string;
  accessToken?: string;
  expiresOn?: string;
};

/**
 * Parses the string returned by `authentication.notifySuccess()` in the popup.
 *
 * New popups send JSON: `{ homeAccountId, accessToken, expiresOn }`.
 * Legacy popups send a plain homeAccountId string. Handles both.
 */
function parseTeamsAuthResult(raw: string): TeamsAuthResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'homeAccountId' in parsed &&
      typeof (parsed as Record<string, unknown>).homeAccountId === 'string'
    ) {
      const obj = parsed as Record<string, unknown>;
      return {
        homeAccountId: obj.homeAccountId as string,
        accessToken:
          typeof obj.accessToken === 'string' ? obj.accessToken : undefined,
        expiresOn:
          typeof obj.expiresOn === 'string' ? obj.expiresOn : undefined,
      };
    }
  } catch {
    // Not JSON — treat as plain homeAccountId string (legacy popup).
  }
  return { homeAccountId: raw };
}

/**
 * Opens the Teams SDK authentication popup to perform MSAL loginRedirect
 * inside a Teams-controlled window (bypasses WebView2 popup blocking).
 *
 * After success, the main app's MSAL instance can find the new account
 * in localStorage (shared origin, same MSAL cache) on platforms where
 * localStorage is shared. On Teams Mobile (partitioned storage), the
 * returned `accessToken` can be used directly as a fallback.
 *
 * @returns Parsed result containing homeAccountId and optionally the access token.
 */
export async function authenticateViaTeamsSdk(
  loginHint?: string
): Promise<TeamsAuthResult> {
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

  const resultString = await authentication.authenticate({
    url,
    width: 600,
    height: 535,
  });

  const result = parseTeamsAuthResult(resultString);

  ssInfo('auth:teams-helper', 'Teams auth popup succeeded', {
    homeAccountId: result.homeAccountId,
    hasAccessToken: !!result.accessToken,
    hasExpiresOn: !!result.expiresOn,
  });
  return result;
}

/**
 * After the Teams auth popup completes, look up the account that was
 * cached by the popup's MSAL instance and set it as active in the
 * main app's MSAL instance.
 *
 * Works on platforms where both windows share localStorage (same origin).
 * On Teams Mobile (partitioned storage), the account may not be found —
 * callers should fall back to the popup-provided access token.
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
