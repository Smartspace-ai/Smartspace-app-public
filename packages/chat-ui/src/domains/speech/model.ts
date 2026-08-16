/**
 * What the backend tells the composer about speech-to-text (dictation).
 * `endpoint` is the Speech resource's custom-domain URL the browser SDK
 * connects to directly; it is absent when speech isn't configured.
 */
export type SpeechConfig = {
  enabled: boolean;
  endpoint?: string | null;
  /** BCP-47 locale to recognise when the client doesn't ask for one. */
  defaultLocale: string;
};

/**
 * A short-lived bearer token for the Speech resource. Handed to the Speech SDK
 * as-is; the backend owns how it is minted.
 */
export type SpeechToken = {
  token: string;
  /** ISO-8601 instant. */
  expiresOn: string;
};
