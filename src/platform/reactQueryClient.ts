// src/platform/reactQueryClient.ts
import { QueryClient } from '@tanstack/react-query';

import { isTransient } from './envelopes';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // retry only network/5xx errors, up to 2 times
      retry: (failureCount, error) => isTransient(error) && failureCount < 2,
      staleTime: 60_000,    // 1 min
      gcTime: 10 * 60_000,  // 10 min
    },
    mutations: {
      // mutations retry at most once on transient failures
      retry: (failureCount, error) => isTransient(error) && failureCount < 1,
    },
  },
});

export default queryClient;
