import { http, HttpResponse } from 'msw';

import { makeThreadSummary, makeThreadsResponse } from '@/test/factories';

export const threadHandlers = [
  http.get('*/workspaces/:workspaceId/messagethreads', () =>
    HttpResponse.json(makeThreadsResponse())
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
