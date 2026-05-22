import './setup';

import { ChatModels, ChatZod } from '@smartspace/api-client';
import { fake } from 'zod-schema-faker/v4';


const notificationItemSchema =
  ChatZod.notificationGetResponse.shape.data.element;

export const makeNotificationDto = (
  overrides: Partial<ChatModels.NotificationsNotification> = {}
): ChatModels.NotificationsNotification => ({
  ...fake(notificationItemSchema),
  ...overrides,
});

export const makeNotificationsResponse = (
  items: ChatModels.NotificationsNotification[] = [makeNotificationDto()]
): ChatModels.NotificationsPagedNotifications => ({
  data: items,
  total: items.length,
  totalUnread: items.filter((n) => !n.dismissedAt).length,
});
