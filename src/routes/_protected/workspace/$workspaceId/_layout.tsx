// routes/_protected/workspace/$workspaceId/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Suspense, useEffect, useMemo } from 'react';

import {
  RouteIdsProvider,
  useRouteIds,
} from '@/platform/routing/RouteIdsProvider';

import {
  useWorkspace,
  workspaceDetailOptions,
} from '@/domains/workspaces/queries';

import { PageSkeleton } from '@/ui/feedback/Skeletons';
import { PendingThreadsProvider } from '@/ui/threads/PendingThreadsContext';

import { getBackgroundGradientClasses } from '@/theme/tag-styles';

function WorkspaceBodyBackground() {
  const { workspaceId } = useRouteIds();
  const { data: workspace } = useWorkspace(workspaceId);

  const gradientClasses = useMemo(() => {
    return getBackgroundGradientClasses({
      tags: workspace?.tags,
      name: workspace?.name,
    });
  }, [workspace?.tags, workspace?.name]);

  useEffect(() => {
    const base = [
      'bg-background',
      'bg-gradient-to-b',
      'from-background',
      'from-10%',
      'via-40%',
      'to-100%',
    ];
    const grad = (gradientClasses || '').split(/\s+/).filter(Boolean);
    const cls = [...base, ...grad];

    document.body.classList.add(...cls);
    return () => {
      document.body.classList.remove(...cls);
    };
  }, [gradientClasses]);

  return null;
}

export const Route = createFileRoute(
  '/_protected/workspace/$workspaceId/_layout'
)({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      workspaceDetailOptions(params.workspaceId)
    ),
  component: () => (
    <RouteIdsProvider>
      <PendingThreadsProvider>
        <WorkspaceBodyBackground />
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </PendingThreadsProvider>
    </RouteIdsProvider>
  ),
});
