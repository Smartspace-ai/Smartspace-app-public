// src/routes/_protected/workspace/no-workspaces.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

import { workspacesListOptions } from '@/domains/workspaces';

import NoWorkspacesAvailable from '@/pages/no_workspaces_available';

export const Route = createFileRoute('/_protected/workspace/no-workspaces')({
  loader: async ({ context }) => {
    // fetchQuery, not ensureQueryData: ensureQueryData only fetches when the
    // cache is empty, returning whatever's cached otherwise regardless of
    // staleTime — it wouldn't bypass a cached "no access" result the way we
    // need here. fetchQuery treats staleTime: 0 as "always refetch", so a
    // user who was just granted access (e.g. via admin's access control tab)
    // isn't stranded by a stale cached result on refresh.
    //
    // Fails open on error (backend 5xx past retries, transient auth glitch):
    // this page used to be fully static and could never error, so a thrown
    // fetch here would newly regress a no-access user on a flaky backend
    // into ProtectedErrorBoundary instead of the intended card.
    const list = await context.queryClient
      .fetchQuery({
        ...workspacesListOptions(),
        staleTime: 0,
      })
      .catch(() => undefined);
    if (list?.length) {
      throw redirect({
        to: '/workspace/$workspaceId',
        params: { workspaceId: list[0].id },
      });
    }
  },
  component: NoWorkspacesAvailable,
});
