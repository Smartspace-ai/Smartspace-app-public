import { useMatch } from '@tanstack/react-router';
import React, { createContext, useContext, useMemo } from 'react';

export type RouteIds = {
  workspaceId: string;
  /** Empty when on thread/new; otherwise a valid thread GUID. */
  threadId: string;
  /** True when the current route is thread/new (new thread, no thread id yet). */
  isNewThreadRoute: boolean;
};

const RouteIdsContext = createContext<RouteIds | null>(null);

/**
 * Routing context for common route params.
 * Kept in platform/routing so `pages/` can stay routing-free.
 */
export function RouteIdsProvider({ children }: { children: React.ReactNode }) {
  // NOTE: the file-router generator creates multiple route ids around $workspaceId.
  // Use `useMatch` on the routes that are actually active to avoid `never` params.
  const threadNewMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/thread/new',
    shouldThrow: false,
  });
  const threadMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/thread/$threadId',
    shouldThrow: false,
  });
  const workspaceIndexMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/',
    shouldThrow: false,
  });
  const workspaceLayoutMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/__layout',
    shouldThrow: false,
  });

  const workspaceId =
    threadNewMatch?.params?.workspaceId ??
    threadMatch?.params?.workspaceId ??
    workspaceIndexMatch?.params?.workspaceId ??
    workspaceLayoutMatch?.params?.workspaceId ??
    '';

  const threadId = threadNewMatch ? '' : threadMatch?.params?.threadId ?? '';
  const isNewThreadRoute = !!threadNewMatch;

  const value = useMemo(
    () => ({ workspaceId, threadId, isNewThreadRoute }),
    [workspaceId, threadId, isNewThreadRoute]
  );
  return (
    <RouteIdsContext.Provider value={value}>
      {children}
    </RouteIdsContext.Provider>
  );
}

export function useRouteIds(): RouteIds {
  const ctx = useContext(RouteIdsContext);
  // Fallback: derive ids from router if provider isn't mounted
  const threadNewMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/thread/new',
    shouldThrow: false,
  });
  const threadMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/thread/$threadId',
    shouldThrow: false,
  });
  const workspaceIndexMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/',
    shouldThrow: false,
  });
  const workspaceLayoutMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/__layout',
    shouldThrow: false,
  });

  const workspaceId =
    threadNewMatch?.params?.workspaceId ??
    threadMatch?.params?.workspaceId ??
    workspaceIndexMatch?.params?.workspaceId ??
    workspaceLayoutMatch?.params?.workspaceId ??
    '';

  const fallbackThreadId = threadNewMatch
    ? ''
    : threadMatch?.params?.threadId ?? '';
  const fallbackIsNewThreadRoute = !!threadNewMatch;
  const fallback: RouteIds | null = workspaceId
    ? {
        workspaceId,
        threadId: fallbackThreadId,
        isNewThreadRoute: fallbackIsNewThreadRoute,
      }
    : null;
  if (ctx) return ctx;
  if (fallback) return fallback;
  throw new Error('useRouteIds must be used within <RouteIdsProvider>.');
}
