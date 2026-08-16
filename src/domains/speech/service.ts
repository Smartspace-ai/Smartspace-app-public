import { apiParsed } from '@/platform/apiParsed';

import type { SpeechConfig, SpeechToken } from '@smartspace/chat-ui';

import { SpeechConfigSchema, SpeechTokenSchema } from './schemas';

/** Whether this install offers dictation and where the browser should connect. */
export async function fetchSpeechConfig(): Promise<SpeechConfig> {
  return apiParsed.get(SpeechConfigSchema, '/speech/config');
}

/**
 * A short-lived Speech token. Called by the Speech SDK (via chat-ui's
 * credential shim) on connect and near expiry — no caching needed here.
 */
export async function fetchSpeechToken(): Promise<SpeechToken> {
  return apiParsed.get(SpeechTokenSchema, '/speech/token');
}
