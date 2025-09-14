import webApi from '@/domains/auth/axios-setup';
import { Notification, NotificationsEnvelopeSchema } from './schemas';



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

  const response = await webApi.get('/notification', {
    params: { unread: isUnreadOnly, skip, take: LIMIT },
  });

  const parsed = NotificationsEnvelopeSchema.parse(response?.data);

  // createdAt is already a Date (schema transform), so sorting is cheap
  const items = parsed.data.slice().sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return {
    items,
    totalCount: parsed.total ?? items.length,
    unreadCount: parsed.totalUnread ?? 0,
  };
}

/** Mark a specific notification as read. */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  return await webApi.put('/notification/update', [notificationId]);
}

/** Mark all notifications as read. */
export async function markAllNotificationsAsRead(): Promise<void> {
  return await webApi.put('/notification/updateall');
}
