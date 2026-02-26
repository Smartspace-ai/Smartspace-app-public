// src/routes/_protected/workspace/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

import { workspacesListOptions } from '@/domains/workspaces/queries';

import TeamsLoaderPage from '@/pages/teams_loader';

export const Route = createFileRoute('/_protected/workspace/')({
  pendingMs: 0,
  pendingComponent: () => <TeamsLoaderPage message="Loading workspaces…" />,
  loader: async ({ context }) => {
    const list = await context.queryClient.ensureQueryData(
      workspacesListOptions()
    );
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
