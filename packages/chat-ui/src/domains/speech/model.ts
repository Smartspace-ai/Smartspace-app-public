/**
 * What the backend tells the composer about speech-to-text (dictation).
 * `region` is the Azure region of the Speech resource, e.g. `australiaeast`.
 * The SDK needs the region rather than the account's custom-domain URL: the
 * recognition path only exists on the regional host, and that is what the
 * issued token is scoped to. Absent when speech isn't configured.
 */
export type SpeechConfig = {
  enabled: boolean;
  region?: string | null;
  /** BCP-47 locale to recognise when the client doesn't ask for one. */
  defaultLocale: string;
};

/**
 * A short-lived token from the Speech resource's own token service, scoped to
 * recognition in one region and good for about ten minutes. Handed to the SDK
 * as-is; the backend owns how it is minted.
 */
export type SpeechToken = {
  token: string;
  /** ISO-8601 instant. */
  expiresOn: string;
};
