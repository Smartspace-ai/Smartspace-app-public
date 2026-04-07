import { api } from '@/platform/api';
import { parseOrThrow } from '@/platform/validation';

import { mapNotificationsEnvelopeDto } from './mapper';
import type { Notification } from './model';
import { notificationsEnvelopeSchema } from './schemas';

export interface NotificationList {
  items: Notification[];
  totalCount: number;
  unreadCount: number;
}

/** Fetch paginated notifications. */
export async function fetchNotifications(
  page = 1,
  isUnreadOnly = false,
  LIMIT = 10
): Promise<NotificationList> {
  const skip = (page - 1) * LIMIT;

  const raw = await api.get('/notification', {
    params: { unread: isUnreadOnly, skip, take: LIMIT },
  });
  const envelope = parseOrThrow(
    notificationsEnvelopeSchema,
    raw,
    'GET /notification'
  );
  const parsed = mapNotificationsEnvelopeDto(envelope);

  const items = parsed.items
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    items,
    totalCount: parsed.totalCount,
    unreadCount: parsed.unreadCount,
  };
}

/** Mark a specific notification as read. */
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  await api.put('/notification/update', [notificationId]);
}

/** Mark all notifications as read. */
export async function markAllNotificationsAsRead(): Promise<void> {
  await api.put('/notification/updateall');
}
