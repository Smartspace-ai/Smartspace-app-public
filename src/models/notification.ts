export enum NotificationType {
  WorkSpaceUpdated = 'WorkSpaceUpdated',
  MessageThreadUpdated = 'MessageThreadUpdated',
  CommentUpdated = 'CommentUpdated',
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

  constructor(params?: Partial<Notification>) {
    Object.assign(this, params || {});
  }
}
