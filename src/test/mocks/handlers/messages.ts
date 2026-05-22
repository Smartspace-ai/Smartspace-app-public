import { http, HttpResponse } from 'msw';

import { makeMessage } from '@/test/factories';

export const messageHandlers = [
  http.get('*/messageThreads/:threadId/messages', () =>
    HttpResponse.json({ data: [makeMessage()] })
  ),
];
