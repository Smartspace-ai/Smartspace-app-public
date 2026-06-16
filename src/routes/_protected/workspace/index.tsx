// src/routes/_protected/workspace/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

import { ssError, ssInfoAlways } from '@/platform/log';

import { workspacesListOptions } from '@/domains/workspaces/queries';

import TeamsLoaderPage from '@/pages/teams_loader';

export const Route = createFileRoute('/_protected/workspace/')({
  pendingMs: 0,
  pendingComponent: () => <TeamsLoaderPage message="Loading workspaces…" />,
  loader: async ({ context }) => {
    const t0 = Date.now();
    ssInfoAlways('route:workspaces', 'loader: fetching workspaces list…');
    let list;
    try {
      list = await context.queryClient.ensureQueryData(workspacesListOptions());
    } catch (e) {
      ssError('route:workspaces', 'workspaces list FAILED', {
        ms: Date.now() - t0,
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
    ssInfoAlways('route:workspaces', 'workspaces list resolved', {
      count: list?.length ?? 0,
      ms: Date.now() - t0,
    });
    if (list?.length) {
      throw redirect({
        to: '/workspace/$workspaceId',
        params: { workspaceId: list[0].id },
      });
    } else {
      throw redirect({ to: '/workspace/no-workspaces' });
    }
  },
});
