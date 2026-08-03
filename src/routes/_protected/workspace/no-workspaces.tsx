// src/routes/_protected/workspace/no-workspaces.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

import { workspacesListOptions } from '@/domains/workspaces';

import NoWorkspacesAvailable from '@/pages/no_workspaces_available';

export const Route = createFileRoute('/_protected/workspace/no-workspaces')({
  loader: async ({ context }) => {
    // Bypass the list's normal 30s staleTime: the user may have just been
    // granted access to a workspace (e.g. via admin's access control tab),
    // and a cached "no access" result would strand them here on refresh.
    const list = await context.queryClient.ensureQueryData({
      ...workspacesListOptions(),
      staleTime: 0,
    });
    if (list?.length) {
      throw redirect({
        to: '/workspace/$workspaceId',
        params: { workspaceId: list[0].id },
      });
    }
  },
  component: NoWorkspacesAvailable,
});
