import { http, HttpResponse } from 'msw';

import { makeCommentSummary } from '@/test/factories';

export const commentHandlers = [
  http.get('*/messagethreads/:threadId/comments', ({ params }) =>
    HttpResponse.json({
      data: [
        makeCommentSummary({ messageThreadId: params.threadId as string }),
      ],
    })
  ),

  http.post('*/messagethreads/:threadId/comments', ({ params }) =>
    HttpResponse.json(
      makeCommentSummary({ messageThreadId: params.threadId as string })
    )
  ),
];
