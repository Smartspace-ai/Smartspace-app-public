// routes/_protected/workspace/$workspaceId/__layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';

import { queryClient } from '@/platform/reactQueryClient';

import { workspaceDetailOptions } from '@/domains/workspaces/queries';

import { RouteIdsProvider } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

export const Route = createFileRoute('/_protected/workspace/$workspaceId/__layout')({
  loader: ({ params }) =>
    queryClient.ensureQueryData(workspaceDetailOptions(params.workspaceId)),
  component: () => (
    <RouteIdsProvider>
      <Outlet />
    </RouteIdsProvider>
  ),
});
