import './setup';

import { ChatModels, ChatZod } from '@smartspace/api-client';
import { fake } from 'zod-schema-faker/v4';


import type { Notification } from '@/domains/notifications/model';
import { NotificationType } from '@/domains/notifications/model';

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

// Notification is a local domain model that uses a typed enum rather than the
// raw string literal the API returns. We build it from the DTO shape so any new
// DTO fields are visible, then remap the two fields that differ.
export const makeNotification = (
  overrides: Partial<Notification> = {}
): Notification => {
  const dto = fake(notificationItemSchema);
  return {
    id: dto.id,
    notificationType: NotificationType.MessageThreadUpdated,
    description: dto.description ?? '',
    createdAt: new Date(dto.createdAt),
    createdBy: dto.createdBy ?? '',
    createdByUserId: dto.createdByUserId ?? '',
    workSpaceId: dto.workSpaceId ?? '',
    threadId: dto.threadId ?? null,
    dismissedAt: dto.dismissedAt ?? null,
    ...overrides,
  };
};
