import { http, HttpResponse } from 'msw';

import { makeThreadSummary, makeThreadsResponse } from '@/test/factories';

// Stable thread ID so the router can redirect to /thread/$threadId reliably.
const E2E_THREAD_ID = 'e2e00000-0000-0000-0000-000000000002';

export const threadHandlers = [
  http.get('*/workspaces/:workspaceId/messagethreads', () =>
    HttpResponse.json(
      makeThreadsResponse([makeThreadSummary({ id: E2E_THREAD_ID })])
    )
  ),

  http.get('*/workspaces/:workspaceId/messagethreads/:threadId', ({ params }) =>
    HttpResponse.json(makeThreadSummary({ id: params.threadId as string }))
  ),

  http.post('*/workspaces/:workspaceId/messagethreads', () =>
    HttpResponse.json({ data: [makeThreadSummary()] })
  ),

  http.delete(
    '*/messagethreads/:threadId',
    () => new HttpResponse(null, { status: 204 })
  ),

  http.put(
    '*/messagethreads/:threadId/name',
    () => new HttpResponse(null, { status: 204 })
  ),

  http.put(
    '*/messagethreads/:threadId/favorited/:pin',
    () => new HttpResponse(null, { status: 204 })
  ),
];
