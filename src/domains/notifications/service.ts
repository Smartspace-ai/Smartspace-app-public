import { ChatApi, ChatZod } from '@smartspace/api-client';

import { parseOrThrow } from '@/platform/validation';

import { mapNotificationsEnvelopeDto } from './mapper';
import type { Notification } from './model';

const { notificationGetResponse: notificationsResponseSchema } = ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

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

  const response = await chatApi.notificationGet({
    unread: isUnreadOnly,
    skip,
    take: LIMIT,
  });
  const parsed = parseOrThrow(
    notificationsResponseSchema,
    response.data,
    'GET /notification'
  );

  const mapped = mapNotificationsEnvelopeDto(parsed);

  const items = mapped.items.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return {
    items,
    totalCount: mapped.totalCount,
    unreadCount: mapped.unreadCount,
  };
}

/** Mark a specific notification as read. */
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  await chatApi.notificationPutUpdate([notificationId]);
}

/** Mark all notifications as read. */
export async function markAllNotificationsAsRead(): Promise<void> {
  await chatApi.notificationPutUpdateall();
}
