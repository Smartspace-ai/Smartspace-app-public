import { NotificationDto, NotificationsEnvelopeDto, TNotificationDto, TNotificationsEnvelopeDto } from './dto';
import { Notification, NotificationType } from './model';

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
    if (lowered === '0' || lowered === 'workspaceupdated') return NotificationType.WorkSpaceUpdated;
    if (lowered === '1' || lowered === 'messagethreadupdated') return NotificationType.MessageThreadUpdated;
    if (lowered === '2' || lowered === 'commentupdated') return NotificationType.CommentUpdated;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return normalizeType(numeric);
  }
  return NotificationType.WorkSpaceUpdated;
};

export function mapNotificationDtoToModel(dto: TNotificationDto): Notification {
  const parsed = NotificationDto.parse(dto);
  return {
    id: parsed.id,
    notificationType: normalizeType(parsed.notificationType),
    description: parsed.description,
    workSpaceId: parsed.workSpaceId ?? undefined,
    threadId: parsed.threadId ?? undefined,
    createdBy: parsed.createdBy,
    createdAt: parsed.createdAt instanceof Date ? parsed.createdAt : new Date(parsed.createdAt),
    dismissedAt: parsed.dismissedAt ?? undefined,
    avatar: parsed.avatar ?? undefined,
  };
}

export function mapNotificationsEnvelopeDto(dto: TNotificationsEnvelopeDto) {
  const env = NotificationsEnvelopeDto.parse(dto);
  const items = env.data.map(mapNotificationDtoToModel);
  return {
    items,
    totalCount: env.total ?? items.length,
    unreadCount: env.totalUnread ?? 0,
  };
}






