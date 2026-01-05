// src/platform/auth/utils.ts
export const parseScopes = (raw?: unknown): string[] =>
    String(raw ?? '').split(/[ ,]+/).map(s => s.trim()).filter(Boolean);
  
  export const isInTeams = (): boolean => {
    try {
      // In Teams desktop, the initial load may include ?inTeams=true, but subsequent navigations
      // (or a reload on a deep link) can drop the query param. Also, desktop may not always be an iframe.
      // So we make Teams detection "sticky" once we know we're in Teams (within the current tab only).
      const isTestMode = (() => {
        try { return (import.meta as any)?.env?.MODE === 'test'; } catch { return false; }
      })();

      const anyWin = window as any;
      // If TeamsProvider has determined the state, trust it (both true and false).
      const stateVal = anyWin?.__teamsState?.isInTeams;
      if (typeof stateVal === 'boolean') return stateVal;

      const KEY = 'ss_inTeams';
      if (!isTestMode) {
        try { if (sessionStorage.getItem(KEY) === '1') return true; } catch { /* ignore */ }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const inTeamsParam = urlParams.get('inTeams') === 'true';
      const embedded = window.parent !== window;
      const detected = inTeamsParam || embedded;

      if (detected && !isTestMode) {
        try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
      }

      return detected;
    } catch { return false; }
  };

/**
 * Normalize a "redirect" value (which may be an absolute URL) into an in-app path.
 * Prevents TanStack Router `navigate/redirect({ to })` from receiving a full URL.
 */
export function normalizeRedirectPath(
  raw: string | null | undefined,
  fallback: string = '/workspace'
): string {
  const value = (raw ?? '').trim();
  if (!value) return fallback;

  // Common safe case: already an internal path.
  if (value.startsWith('/')) {
    // Avoid looping back into login.
    if (value.startsWith('/login')) return fallback;
    return value;
  }

  // Absolute URL: allow only same-origin, then strip origin.
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(value, base);
    if (typeof window !== 'undefined' && url.origin !== window.location.origin) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (path.startsWith('/login')) return fallback;
    return path || fallback;
  } catch {
    return fallback;
  }
}
  