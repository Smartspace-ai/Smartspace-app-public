// src/platform/reactQueryClient.ts
import { MutationCache, QueryClient } from '@tanstack/react-query';

import { AuthRequiredError } from './auth/errors';
import { SESSION_QUERY_KEY } from './auth/sessionQuery';
import { isTransient } from './envelopes';

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof AuthRequiredError) {
        queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Never retry auth errors; retry only network/5xx errors, up to 2 times
      retry: (failureCount, error) => {
        if (error instanceof AuthRequiredError) return false;
        return isTransient(error) && failureCount < 2;
      },
      staleTime: 60_000, // 1 min
      // 2 min — every visited thread caches its full message list under
      // its own key, so a generous gcTime piles up retained messages
      // (and their channels/values) when the user hops threads. 2 min
      // is short enough to release abandoned threads quickly while still
      // letting "back/forward between two threads" hit a warm cache.
      gcTime: 2 * 60_000,
    },
    mutations: {
      // Never retry auth errors; retry at most once on transient failures
      retry: (failureCount, error) => {
        if (error instanceof AuthRequiredError) return false;
        return isTransient(error) && failureCount < 1;
      },
    },
  },
});

export default queryClient;
