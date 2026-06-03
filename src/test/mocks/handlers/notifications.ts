import { http, HttpResponse } from 'msw';

import { makeNotificationsResponse } from '@/test/factories';

export const notificationHandlers = [
  http.get('*/notification', () =>
    HttpResponse.json(makeNotificationsResponse())
  ),

  http.put('*/notification', () => new HttpResponse(null, { status: 204 })),

  http.put(
    '*/notification/updateall',
    () => new HttpResponse(null, { status: 204 })
  ),
];
