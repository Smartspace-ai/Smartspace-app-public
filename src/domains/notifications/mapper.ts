import { ChatZod } from '@smartspace/api-client';
import type { z } from 'zod';

import { utcDate } from '@/shared/utils/dateFromApi';

import { Notification, NotificationType } from './model';

const { notificationGetResponse: notificationsResponseSchema } = ChatZod;

type NotificationsResponseDto = z.infer<typeof notificationsResponseSchema>;
type NotificationDto = NotificationsResponseDto['data'][number];

const normalizeType = (value: unknown): NotificationType => {
  if (typeof value === 'number') {
    return value === 1
      ? NotificationType.MessageThreadUpdated
      : value === 2
      ? NotificationType.CommentUpdated
      : NotificationType.WorkSpaceUpdated;
  }
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (lowered === '0' || lowered === 'workspaceupdated')
      return NotificationType.WorkSpaceUpdated;
    if (lowered === '1' || lowered === 'messagethreadupdated')
      return NotificationType.MessageThreadUpdated;
    if (lowered === '2' || lowered === 'commentupdated')
      return NotificationType.CommentUpdated;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return normalizeType(numeric);
  }
  return NotificationType.WorkSpaceUpdated;
};

export function mapNotificationDtoToModel(dto: NotificationDto): Notification {
  return {
    id: dto.id ?? '',
    notificationType: normalizeType(dto.notificationType),
    description: dto.description ?? '',
    workSpaceId: dto.workSpaceId ?? undefined,
    threadId: dto.threadId ?? undefined,
    createdBy: dto.createdBy ?? '',
    createdAt: dto.createdAt ? utcDate(dto.createdAt) : new Date(0),
    dismissedAt: dto.dismissedAt ?? undefined,
    avatar: undefined,
  };
}

export function mapNotificationsEnvelopeDto(dto: NotificationsResponseDto) {
  const items = dto.data.map(mapNotificationDtoToModel);
  return {
    items,
    totalCount: dto.total,
    unreadCount: dto.totalUnread,
  };
}
