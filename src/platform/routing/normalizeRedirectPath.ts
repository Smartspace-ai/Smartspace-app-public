// src/platform/routing/normalizeRedirectPath.ts
/**
 * Normalize a "redirect" value (which may be an absolute URL) into an in-app path.
 * Prevents TanStack Router `navigate/redirect({ to })` from receiving a full URL.
 */
export function normalizeRedirectPath(
  raw: string | null | undefined,
  fallback = '/workspace'
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



