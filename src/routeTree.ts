// src/routeTree.ts
// A stable (non-generated) route tree for TanStack Router.
// This avoids depending on `routeTree.gen.ts` during lint/typecheck in CI.

import { Route as RootRoute } from '@/routes/__root';
import { Route as RootNotFoundRoute } from '@/routes/__root.notFound';
import { Route as ProtectedRoute } from '@/routes/_protected';
import { Route as WorkspaceRedirectRoute } from '@/routes/_protected/workspace';
import { Route as WorkspaceIndexRoute } from '@/routes/_protected/workspace/$workspaceId';
import { Route as WorkspaceLayoutRoute } from '@/routes/_protected/workspace/$workspaceId/__layout';
import { Route as ThreadRoute } from '@/routes/_protected/workspace/$workspaceId/thread/$threadId';
import { Route as NoWorkspacesRoute } from '@/routes/_protected/workspace/no-workspaces';
import { Route as IndexRoute } from '@/routes/index';
import { Route as LoginRoute } from '@/routes/login';

export const routeTree = RootRoute.addChildren([
  IndexRoute,
  LoginRoute,
  RootNotFoundRoute,
  ProtectedRoute.addChildren([
    WorkspaceRedirectRoute,
    NoWorkspacesRoute,
    WorkspaceLayoutRoute.addChildren([WorkspaceIndexRoute, ThreadRoute]),
  ]),
]);
