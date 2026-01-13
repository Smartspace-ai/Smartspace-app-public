import { useMatch, useParams } from '@tanstack/react-router';
import React, { createContext, useContext, useMemo } from 'react';

export type RouteIds = {
  workspaceId: string;
  threadId: string;
};

const RouteIdsContext = createContext<RouteIds | null>(null);

/**
 * Routing context for common route params.
 * Kept in platform/routing so `pages/` can stay routing-free.
 */
export function RouteIdsProvider({ children }: { children: React.ReactNode }) {
  // Always-available workspaceId from parent route
  const { workspaceId } = useParams({
    from: '/_protected/workspace/$workspaceId',
  });
  // Optional threadId from child route (do not throw if not active)
  const threadMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/thread/$threadId',
    shouldThrow: false,
  });
  const threadId = threadMatch?.params?.threadId ?? '';

  const value = useMemo(
    () => ({ workspaceId, threadId }),
    [workspaceId, threadId]
  );
  return (
    <RouteIdsContext.Provider value={value}>{children}</RouteIdsContext.Provider>
  );
}

export function useRouteIds(): RouteIds {
  const ctx = useContext(RouteIdsContext);
  // Fallback: derive ids from router if provider isn't mounted
  const { workspaceId } = useParams({ from: '/_protected/workspace/$workspaceId' });
  const threadMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/thread/$threadId',
    shouldThrow: false,
  });
  const fallback: RouteIds | null = workspaceId
    ? { workspaceId, threadId: threadMatch?.params?.threadId ?? '' }
    : null;
  if (ctx) return ctx;
  if (fallback) return fallback;
  throw new Error('useRouteIds must be used within <RouteIdsProvider>.');
}

