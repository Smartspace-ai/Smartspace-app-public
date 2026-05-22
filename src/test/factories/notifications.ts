import { faker } from '@faker-js/faker';
import type { ChatModels } from '@smartspace/api-client';

import type { Notification } from '@/domains/notifications/model';
import { NotificationType } from '@/domains/notifications/model';

import { isoDate, oneOf, uuid } from './primitives';

const notificationTypes = [
  'WorkSpaceUpdated',
  'MessageThreadUpdated',
  'CommentUpdated',
] as const;

export const makeNotificationDto = (
  overrides: Partial<ChatModels.NotificationsNotification> = {}
): ChatModels.NotificationsNotification => ({
  id: uuid(),
  notificationType: oneOf(notificationTypes),
  description: faker.lorem.sentence(),
  createdAt: isoDate(),
  createdBy: faker.person.fullName(),
  createdByUserId: uuid(),
  workSpaceId: uuid(),
  threadId: null,
  dismissedAt: null,
  ...overrides,
});

export const makeNotificationsResponse = (
  items: ChatModels.NotificationsNotification[] = [makeNotificationDto()]
): ChatModels.NotificationsPagedNotifications => ({
  data: items,
  total: items.length,
  totalUnread: items.filter((n) => !n.dismissedAt).length,
});

export const makeNotification = (
  overrides: Partial<Notification> = {}
): Notification => ({
  id: uuid(),
  notificationType: NotificationType.MessageThreadUpdated,
  description: faker.lorem.sentence(),
  createdAt: new Date(),
  createdBy: faker.person.fullName(),
  createdByUserId: uuid(),
  workSpaceId: uuid(),
  threadId: null,
  dismissedAt: null,
  ...overrides,
});
