import { queryOptions, useQuery } from '@tanstack/react-query';

import { useChatService } from '@/platform/chat';

import type { SpeechConfig } from './model';
import { speechKeys } from './queryKeys';

const unavailable: SpeechConfig = { enabled: false, defaultLocale: 'en-US' };

/** A backend that predates the feature has no such route; that is a definitive "no". */
const isNotFound = (error: unknown) =>
  (error as { type?: unknown } | null)?.type === 'NotFound' ||
  (error as { response?: { status?: number } } | null)?.response?.status ===
    404;

/**
 * Whether dictation is available on this install and how to connect. Read once
 * per app session — it only changes with a deploy — and disabled entirely for
 * services that don't implement speech, in which case the composer renders no
 * microphone.
 *
 * A definitive answer (including a 404 from an older backend) is cached for the
 * session; a transient failure is retried, because otherwise one blip on load
 * would silently disable the mic until the page is reloaded.
 */
export function useSpeechConfig() {
  const service = useChatService();
  const supported = !!service.getSpeechConfig && !!service.getSpeechToken;
  return useQuery({
    ...queryOptions({
      queryKey: speechKeys.config(),
      queryFn: async () => {
        try {
          return (await service.getSpeechConfig?.()) ?? unavailable;
        } catch (error) {
          if (isNotFound(error)) return unavailable;
          throw error;
        }
      },
      staleTime: Infinity,
      retry: (failureCount) => failureCount < 2,
      retryDelay: 1000,
    }),
    enabled: supported,
  });
}
