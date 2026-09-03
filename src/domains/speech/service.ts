import { apiParsed } from '@/platform/apiParsed';

import type { SpeechConfig, SpeechToken } from '@smartspace/chat-ui';

import { SpeechConfigSchema, SpeechTokenSchema } from './schemas';

/** Whether this install offers dictation and where the browser should connect. */
export async function fetchSpeechConfig(): Promise<SpeechConfig> {
  return apiParsed.get(SpeechConfigSchema, '/speech/config');
}

/**
 * A ~10-minute token from the Speech account's own token service. Fetched once
 * per dictation session and handed to the SDK as-is; never refreshed, so don't
 * cache it here either.
 */
export async function fetchSpeechToken(): Promise<SpeechToken> {
  return apiParsed.get(SpeechTokenSchema, '/speech/token');
}
