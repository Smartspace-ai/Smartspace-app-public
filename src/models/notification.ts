export enum NotificationType {
  WorkSpaceUpdated = 0,
  MessageThreadUpdated = 1,
  CommentUpdated = 2,
}

export const notificationEntityTypeAccept = {
  admin: [NotificationType.WorkSpaceUpdated],
};

export class Notification {
  id!: string;
  notificationType!: NotificationType;
  description!: string;
  workSpaceId?: string;
  threadId?: string;
  createdBy!: string;
  createdAt!: string;
  dismissedAt?: string;
  avatar?: string;

  constructor(params?: NotificationParams) {
    Object.assign(this, params || {});
    if (!params) return;

    const anyParams = params as Record<string, unknown>;
    const get = <T>(camel: string, pascal: string): T | undefined =>
      (anyParams[camel] as T | undefined) ?? (anyParams[pascal] as T | undefined);

    const typeVal = (anyParams['notificationType'] ?? anyParams['NotificationType']);
    if (typeVal !== undefined) {
      this.notificationType = normalizeNotificationType(typeVal);
    }

    const id = get<string>('id', 'Id');
    if (id !== undefined) this.id = id;

    const description = get<string>('description', 'Description');
    if (description !== undefined) this.description = description;

    const workSpaceId = get<string>('workSpaceId', 'WorkSpaceId');
    if (workSpaceId !== undefined) this.workSpaceId = workSpaceId;

    const threadId = get<string>('threadId', 'ThreadId');
    if (threadId !== undefined) this.threadId = threadId;

    const createdBy = get<string>('createdBy', 'CreatedBy');
    if (createdBy !== undefined) this.createdBy = createdBy;

    const createdAt = get<string>('createdAt', 'CreatedAt');
    if (createdAt !== undefined) this.createdAt = createdAt;

    const dismissedAt = get<string>('dismissedAt', 'DismissedAt');
    if (dismissedAt !== undefined) this.dismissedAt = dismissedAt;

    const avatar = get<string>('avatar', 'Avatar');
    if (avatar !== undefined) this.avatar = avatar;
  }
}

export type NotificationParams = Partial<
  Omit<Notification, 'notificationType'>
> & { notificationType?: number | string | NotificationType };

export function normalizeNotificationType(value: unknown): NotificationType {
  if (typeof value === 'number') {
    switch (value) {
      case 0:
        return NotificationType.WorkSpaceUpdated;
      case 1:
        return NotificationType.MessageThreadUpdated;
      case 2:
        return NotificationType.CommentUpdated;
      default:
        return NotificationType.WorkSpaceUpdated;
    }
  }
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (lowered === '0' || lowered === 'workspaceupdated') return NotificationType.WorkSpaceUpdated;
    if (lowered === '1' || lowered === 'messagethreadupdated') return NotificationType.MessageThreadUpdated;
    if (lowered === '2' || lowered === 'commentupdated') return NotificationType.CommentUpdated;
    // also try to parse numeric strings
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) return normalizeNotificationType(numeric);
    return NotificationType.WorkSpaceUpdated;
  }
  return NotificationType.WorkSpaceUpdated;
}
