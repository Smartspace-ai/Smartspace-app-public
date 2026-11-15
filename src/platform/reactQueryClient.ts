// src/platform/reactQueryClient.ts
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { AuthRequiredError } from './auth/errors';
import { SESSION_QUERY_KEY } from './auth/sessionQuery';
import { isTransient, isTransientRead } from './envelopes';
import { ssError } from './log';

export const queryClient = new QueryClient({
  // React Query does not log a failed query. Without this, a response that
  // fails its zod schema shows only as a component's error state.
  queryCache: new QueryCache({
    // Never log the raw error: an AxiosError carries the request's
    // Authorization header, and the log is copied by Copy diagnostics.
    onError: (error, query) => {
      const e = (error ?? {}) as {
        type?: unknown;
        issues?: unknown;
        message?: unknown;
        status?: unknown;
        code?: unknown;
        traceId?: unknown;
        response?: { status?: unknown; data?: unknown };
      };
      if (e.type === 'ValidationError') {
        ssError('query', 'response failed validation', {
          queryKey: query.queryKey,
          issues: e.issues,
        });
        return;
      }
      const body = (e.response?.data ?? {}) as {
        code?: unknown;
        traceId?: unknown;
      };
      ssError('query', 'request failed', {
        queryKey: query.queryKey,
        status: e.response?.status ?? e.status,
        code: body.code ?? e.code,
        traceId: body.traceId ?? e.traceId,
        message: e.message,
      });
    },
  }),
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
      // Never retry auth errors; retry what isTransientRead allows, up to 2 times
      retry: (failureCount, error) => {
        if (error instanceof AuthRequiredError) return false;
        return isTransientRead(error) && failureCount < 2;
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
