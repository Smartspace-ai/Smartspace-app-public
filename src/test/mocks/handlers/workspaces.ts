import { http, HttpResponse } from 'msw';

import {
  makeAppUser,
  makeWorkspace,
  makeWorkspacesResponse,
} from '@/test/factories';

// Stable workspace ID used across all workspace-related handlers so the
// router can redirect from /workspace/ → /workspace/$workspaceId reliably.
const E2E_WORKSPACE_ID = 'e2e00000-0000-0000-0000-000000000001';

export const workspaceHandlers = [
  http.get('*/workspaces', () =>
    HttpResponse.json(
      makeWorkspacesResponse([makeWorkspace({ id: E2E_WORKSPACE_ID })])
    )
  ),

  http.get('*/workspaces/:workspaceId', ({ params }) =>
    HttpResponse.json(makeWorkspace({ id: params.workspaceId as string }))
  ),

  http.get('*/workspaces/:workspaceId/users', () =>
    HttpResponse.json([makeAppUser(), makeAppUser()])
  ),
];
