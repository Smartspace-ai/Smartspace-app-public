export enum NotificationType {
  WorkSpaceUpdated = 0,
  MessageThreadUpdated = 1,
  CommentUpdated = 2,
}

export type Notification = {
  id: string;
  notificationType: NotificationType;
  description: string;
  workSpaceId?: string | null;
  threadId?: string | null;
  createdBy: string;
  createdAt: Date;
  dismissedAt?: string | null;
  avatar?: string | null;
};






