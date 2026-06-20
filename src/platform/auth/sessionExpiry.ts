// Reactive recovery for an expired session.
//
// The request interceptor acquires tokens silently (`silentOnly`). When silent
// acquisition stops working — typically a couple of hours in, once the refresh
// token / hidden-iframe renewal can no longer mint a token — in-flight requests
// fail and the only redirect-to-login lives in the route `beforeLoad`, which
// runs on navigation, not while the user idles on a page. The server now marks
// auth-middleware 401s with `X-Reauth-Required` so we can also react to a live
// 401. Both paths funnel here.
//
// This is the single, de-duplicated escalation point: many concurrent failures
// trigger exactly one recovery.
import { getAuthAdapter } from '@/platform/auth/index';
import { isInTeams } from '@/platform/auth/msalConfig';
import {
  getAuthRuntimeState,
  setSessionExpired,
} from '@/platform/auth/runtime';
import { ssInfoAlways, ssWarn } from '@/platform/log';

let reauthInProgress = false;

function isE2E(): boolean {
  return import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';
}

function onLoginScreen(): boolean {
  try {
    return (window.location?.pathname || '').startsWith('/login');
  } catch {
    return false;
  }
}

function inTeamsEnvironment(): boolean {
  return getAuthRuntimeState().isInTeams === true || isInTeams();
}

/**
 * Recover from a session whose silent token can no longer be acquired (or whose
 * requests the server rejects with an auth-middleware 401). De-duplicated.
 *
 * - Pure web: redirect through interactive sign-in (`loginRedirect`) — automatic,
 *   no user gesture needed; `signIn()` stores the return URL.
 * - Teams: a popup needs a user gesture, so flag the session as expired and let
 *   the root-level prompt drive `signIn()` on click.
 */
export async function handleSessionExpired(): Promise<void> {
  if (isE2E() || reauthInProgress || onLoginScreen()) return;
  reauthInProgress = true;

  try {
    if (inTeamsEnvironment()) {
      // Can't open a popup without a gesture — surface a prompt instead.
      setSessionExpired(true);
      return;
    }
    ssInfoAlways('auth', 'session expired -> interactive sign-in redirect');
    await getAuthAdapter().signIn();
  } catch (e) {
    ssWarn('auth', 'session-expiry recovery failed', e);
    // Allow a retry on the next failure rather than wedging the guard.
    reauthInProgress = false;
  }
}

/** Clear the guard + prompt once a fresh session is established. */
export function resetSessionExpiry(): void {
  reauthInProgress = false;
  setSessionExpired(false);
}

/**
 * True when a 401 is an auth-middleware rejection (expired/invalid/missing
 * token), signalled by the backend's `X-Reauth-Required` header. Domain 401s
 * (`SmartSpaceException` Security → `application/problem+json`) never carry it,
 * so they don't trigger re-auth. Accepts AxiosHeaders, a fetch `Headers`, or a
 * plain record — header names are case-insensitive.
 */
export function isReauthRequired(headers: unknown): boolean {
  try {
    const h = headers as
      | { get?: (k: string) => unknown }
      | Record<string, unknown>
      | null;
    if (!h) return false;
    const get = (h as { get?: (k: string) => unknown }).get;
    const raw =
      typeof get === 'function'
        ? get.call(h, 'x-reauth-required')
        : (h as Record<string, unknown>)['x-reauth-required'] ??
          (h as Record<string, unknown>)['X-Reauth-Required'];
    return String(raw ?? '').toLowerCase() === 'true';
  } catch {
    return false;
  }
}

/**
 * True when a SignalR error is an auth rejection — the negotiate request 401s
 * once the token can no longer be silently refreshed. This is the reliable
 * expiry signal (the accessTokenFactory swallows failures and returns '').
 */
export function isUnauthorizedError(err: unknown): boolean {
  const e = err as { statusCode?: number; message?: string } | undefined;
  if (e?.statusCode === 401) return true;
  return /\b401\b|unauthorized/i.test(String(e?.message ?? ''));
}
