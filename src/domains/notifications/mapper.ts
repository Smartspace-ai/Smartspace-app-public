import type { z } from 'zod';

import type { Notification } from './model';
import { notificationSchema, notificationsEnvelopeSchema } from './schemas';

type NotificationParsed = z.output<typeof notificationSchema>;
type EnvelopeParsed = z.output<typeof notificationsEnvelopeSchema>;

export function mapNotificationDtoToModel(
  dto: NotificationParsed
): Notification {
  return {
    id: dto.id,
    notificationType: dto.notificationType,
    description: dto.description,
    workSpaceId: dto.workSpaceId ?? undefined,
    threadId: dto.threadId ?? undefined,
    createdBy: dto.createdBy,
    createdAt: dto.createdAt,
    dismissedAt: dto.dismissedAt ?? undefined,
    avatar: dto.avatar ?? undefined,
  };
}

export function mapNotificationsEnvelopeDto(dto: EnvelopeParsed) {
  const items = dto.data.map(mapNotificationDtoToModel);
  return {
    items,
    totalCount: dto.total ?? items.length,
    unreadCount: dto.totalUnread ?? 0,
  };
}
