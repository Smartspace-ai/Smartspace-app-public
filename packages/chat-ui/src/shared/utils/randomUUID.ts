/**
 * Safe wrapper around `crypto.randomUUID()` with a timestamp-based fallback
 * for environments that don't expose the Web Crypto API (e.g. non-secure
 * contexts, old Node test runners, JSDOM without the flag).
 *
 * The fallback is intentionally detectable: IDs start with the current
 * millisecond timestamp, making it trivially obvious in logs/tests when the
 * real API is unavailable. It is not cryptographically strong — use it only
 * for transient optimistic-UI identifiers that are discarded once the server
 * responds.
 */
export function randomUUID(): string {
  const cryptoObj = (globalThis as unknown as { crypto?: Crypto | undefined })
    ?.crypto;
  return typeof cryptoObj?.randomUUID === 'function'
    ? cryptoObj.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
