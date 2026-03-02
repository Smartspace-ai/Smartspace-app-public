import { queryOptions } from '@tanstack/react-query';

import { getAuthAdapter } from './index';

export const SESSION_QUERY_KEY = ['auth', 'session'] as const;

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: [...SESSION_QUERY_KEY],
    queryFn: async () => {
      const adapter = getAuthAdapter();
      return adapter.getSession();
    },
    staleTime: 5 * 60_000, // 5 min — session doesn't change often
    gcTime: 10 * 60_000, // 10 min
    retry: 1, // Retry once — absorbs transient MSAL cache delays on Teams Desktop
    refetchOnWindowFocus: true, // re-check session on tab focus
  });
}
