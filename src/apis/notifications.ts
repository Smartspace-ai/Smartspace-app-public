import webApi from '@/domains/auth/axios-setup';
import { Notification } from '@/models/notification';

const LIMIT = 10;

export interface NotificationList {
  items: Notification[];
  totalCount: number;
  unreadCount: number;
}

/**
 * Fetch paginated notifications.
 */
export async function fetchNotifications(
  page = 1,
  isUnreadOnly = false
): Promise<NotificationList> {
  try {
    const skip = (page - 1) * LIMIT;

    const response = await webApi.get('/notification', {
      params: {
        unread: isUnreadOnly,
        skip,
        take: LIMIT,
      },
    });

    const data = response?.data;

    if (!Array.isArray(data?.data)) {
      throw new Error('Invalid API response: "data.data" must be an array.');
    }

    const items = (data.data as Notification[])
      .map((item) => new Notification(item))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return {
      items,
      totalCount: data.total ?? items.length,
      unreadCount: data.totalUnread ?? 0,
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
}

/**
 * Mark a specific notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  try {
    await webApi.put('/notification/update', [notificationId]);
  } catch (error) {
    console.error(
      `Error marking notification ${notificationId} as read:`,
      error
    );
    throw new Error('Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    await webApi.put('/notification/updateall');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}
