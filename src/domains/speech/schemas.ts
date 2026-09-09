import { z } from 'zod';

// Hand-written until the generated client catches up with GET /speech/*
// (same story as /flowruns/{id}/cancel). Swap for ChatZod once it republishes.
export const SpeechConfigSchema = z.object({
  enabled: z.boolean(),
  region: z.string().nullish(),
  defaultLocale: z.string().default('en-US'),
});

export const SpeechTokenSchema = z.object({
  token: z.string().min(1),
  expiresOn: z.string(),
});
