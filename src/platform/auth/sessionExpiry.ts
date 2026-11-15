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
import { isInTeams } from '@/platform/auth/msalConfig';
import {
  refreshWebTokenSilently,
  signInWithPopup,
} from '@/platform/auth/providers/msalWeb';
import {
  getAuthRuntimeState,
  setAuthStuck,
  setSessionExpired,
} from '@/platform/auth/runtime';
import { ssInfoAlways, ssWarn } from '@/platform/log';

let reauthInProgress = false;

// Loop-breaker. Persist a sliding window of attempt timestamps in
// sessionStorage (it outlives a reload); after too many in a short window, stop
// (re-auth isn't clearing the 401 — revoked access, a conditional-access gate,
// or a backend rejecting a valid token) and surface a terminal prompt instead
// of an infinite loop. A click on the prompt is not counted.
const REAUTH_LOG_KEY = 'ss_reauth_log';
const REAUTH_MAX = 3;
const REAUTH_WINDOW_MS = 60_000;

/** Record an attempt; return false once too many have fired within the window. */
function withinReauthBudget(): boolean {
  try {
    const now = Date.now();
    const raw = sessionStorage.getItem(REAUTH_LOG_KEY);
    const recent = (raw ? (JSON.parse(raw) as number[]) : []).filter(
      (t) => now - t < REAUTH_WINDOW_MS
    );
    recent.push(now);
    sessionStorage.setItem(REAUTH_LOG_KEY, JSON.stringify(recent));
    return recent.length <= REAUTH_MAX;
  } catch {
    return true; // storage unavailable — don't block recovery
  }
}

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

export function inTeamsEnvironment(): boolean {
  return getAuthRuntimeState().isInTeams === true || isInTeams();
}

const renewedListeners = new Set<() => void>();

/**
 * Run `listener` each time the web session is renewed, by the silent refresh
 * or the sign-in popup. The app uses it to re-run the queries and route
 * loaders that failed while the session was dead. Returns the unsubscribe.
 */
export function onSessionRenewed(listener: () => void): () => void {
  renewedListeners.add(listener);
  return () => renewedListeners.delete(listener);
}

function notifyRenewed(): void {
  for (const listener of renewedListeners) listener();
}

/**
 * Recover from a session whose silent token can no longer be acquired (or whose
 * requests the server rejects with an auth-middleware 401). De-duplicated.
 *
 * - Web: one silent refresh that skips the cached token. If it works, the
 *   failed screens re-run. If not, the root prompt asks the user to sign in;
 *   its click opens the popup (`renewSessionWithPopup`). The page and anything
 *   typed survive either way.
 * - Teams: a popup needs a user gesture, so flag the session as expired and let
 *   the root-level prompt drive `signIn()` on click.
 */
export async function handleSessionExpired(): Promise<void> {
  // While the prompt waits for its click, reauthInProgress stays set, so more
  // failures spend no attempts.
  if (isE2E() || reauthInProgress || onLoginScreen()) return;

  // Stop looping if re-auth keeps firing without resolving the 401.
  if (!withinReauthBudget()) {
    ssWarn('auth', 'too many re-auth attempts — surfacing stuck state');
    setAuthStuck(true);
    return;
  }

  reauthInProgress = true;

  if (inTeamsEnvironment()) {
    // Can't open a popup without a gesture — surface a prompt instead.
    setSessionExpired(true);
    return;
  }

  ssInfoAlways('auth', 'session expired -> silent refresh');
  try {
    await refreshWebTokenSilently();
  } catch (e) {
    ssWarn('auth', 'silent refresh failed -> sign-in prompt', e);
    setSessionExpired(true);
    return;
  }
  // Not a sign-in, so the attempt log is kept: a server that rejects every
  // fresh token still reaches the stuck prompt instead of looping.
  reauthInProgress = false;
  notifyRenewed();
}

let popupInFlight: Promise<void> | null = null;

/**
 * Web: open the sign-in popup from the prompt's click. Call it synchronously in
 * the click handler. Repeated clicks share one popup. Only a completed popup
 * renews the session; a closed, blocked or failed one leaves the prompt up.
 */
export function renewSessionWithPopup(): Promise<void> {
  if (popupInFlight) return popupInFlight;
  popupInFlight = signInWithPopup()
    .then(() => {
      resetSessionExpiry();
      notifyRenewed();
    })
    .catch((e: unknown) => {
      ssWarn('auth', 'sign-in popup did not complete', e);
    })
    .finally(() => {
      popupInFlight = null;
    });
  return popupInFlight;
}

/** Clear the guard + prompt + attempt log once a fresh session is established. */
export function resetSessionExpiry(): void {
  reauthInProgress = false;
  setSessionExpired(false);
  setAuthStuck(false);
  try {
    sessionStorage.removeItem(REAUTH_LOG_KEY);
  } catch {
    /* ignore */
  }
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
