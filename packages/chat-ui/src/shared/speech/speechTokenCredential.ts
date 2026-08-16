import type { SpeechToken } from '@/domains/speech/model';

/**
 * Structural stand-in for `@azure/core-auth`'s `TokenCredential` — what
 * `SpeechConfig.fromEndpoint(url, credential)` accepts. Declared here rather
 * than imported so this package doesn't take a type dependency on a transitive
 * package of the SDK.
 */
export type SpeechTokenCredential = {
  getToken: (
    scopes: string | string[]
  ) => Promise<{ token: string; expiresOnTimestamp: number }>;
};

/** Refresh this long before expiry so a token never dies mid-utterance. */
const REFRESH_SKEW_MS = 2 * 60_000;

/**
 * How long to assume a token lasts when its expiry doesn't parse. Long enough to
 * outlive a dictation session (capped at 3 minutes) so the SDK's reconnects hit
 * the cache, short enough that we still refresh rather than reusing it forever.
 */
const ASSUMED_LIFETIME_MS = 10 * 60_000;

const toAccessToken = (t: SpeechToken) => {
  const parsed = Date.parse(t.expiresOn);
  return {
    token: t.token,
    // Without this, an unparseable expiry makes every cache check fail and
    // re-fetches a token on each SDK reconnect.
    expiresOnTimestamp: Number.isNaN(parsed)
      ? Date.now() + ASSUMED_LIFETIME_MS
      : parsed,
  };
};

/**
 * Adapts the app's authenticated token fetch to the shape the Speech SDK wants.
 * The SDK calls `getToken` when it connects and again as the token nears expiry;
 * caching means a long dictation doesn't re-hit the API on every reconnect, and
 * concurrent callers share one in-flight request.
 *
 * `seed` is the token the caller already fetched to start the session. Passing it
 * keeps the SDK's first connect off the network, and — more importantly — means a
 * failed fetch surfaces to the caller with its own error rather than reaching us
 * inside SDK internals, where it would only ever resurface as a generic cancel.
 */
export function createSpeechTokenCredential(
  fetchToken: () => Promise<SpeechToken>,
  seed?: SpeechToken
): SpeechTokenCredential {
  let cached = seed ? toAccessToken(seed) : null;
  let inflight: Promise<{ token: string; expiresOnTimestamp: number }> | null =
    null;

  return {
    getToken: async () => {
      if (cached && cached.expiresOnTimestamp - Date.now() > REFRESH_SKEW_MS) {
        return cached;
      }
      if (!inflight) {
        inflight = fetchToken()
          .then((t) => {
            cached = toAccessToken(t);
            return cached;
          })
          .finally(() => {
            inflight = null;
          });
      }
      return inflight;
    },
  };
}
