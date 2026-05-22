import { http, HttpResponse } from 'msw';

import {
  makeAppUser,
  makeWorkspace,
  makeWorkspacesResponse,
} from '@/test/factories';

export const workspaceHandlers = [
  http.get('*/workspaces', () => HttpResponse.json(makeWorkspacesResponse())),

  http.get('*/workspaces/:workspaceId', ({ params }) =>
    HttpResponse.json(makeWorkspace({ id: params.workspaceId as string }))
  ),

  http.get('*/workspaces/:workspaceId/users', () =>
    HttpResponse.json([makeAppUser(), makeAppUser()])
  ),
];
