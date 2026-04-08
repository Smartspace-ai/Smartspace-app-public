import { apiParsed } from '@/platform/apiParsed';

import { NotificationsEnvelopeDto } from './dto';
import { mapNotificationsEnvelopeDto } from './mapper';
import type { Notification } from './model';



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

  const envelope = await apiParsed.get(NotificationsEnvelopeDto, '/notification', { params: { unread: isUnreadOnly, skip, take: LIMIT } });

  const parsed = mapNotificationsEnvelopeDto(envelope);

  const items = parsed.items.slice().sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return {
    items,
    totalCount: parsed.totalCount,
    unreadCount: parsed.unreadCount,
  };
}

/** Mark a specific notification as read. */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await apiParsed.put(NotificationsEnvelopeDto.passthrough().optional(), '/notification/update', [notificationId]);
}

/** Mark all notifications as read. */
export async function markAllNotificationsAsRead(): Promise<void> {
  await apiParsed.put(NotificationsEnvelopeDto.passthrough().optional(), '/notification/updateall');
}
