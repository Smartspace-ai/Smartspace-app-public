export enum NotificationType {
  WorkSpaceUpdated = 'WorkSpaceUpdated',
  MessageThreadUpdated = 'MessageThreadUpdated',
  CommentUpdated = 'CommentUpdated',
}

export const notificationEntityTypeAccept = {
  admin: [NotificationType.WorkSpaceUpdated],
  web: [NotificationType.MessageThreadUpdated, NotificationType.CommentUpdated],
};

export interface INotification {
  id: string;
  notificationType: NotificationType;
  description: string;
  workSpaceId?: string;
  threadId?: string;
  createdBy: string;
  createdAt: string;
  dismissedAt?: string;
  avatar?: string;
}

export interface INotificationList {
  data: INotification[];
  totalUnread: number;
  total: number;
}

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

  constructor(params?: Partial<Notification>) {
    Object.assign(this, params || {});
  }
}
