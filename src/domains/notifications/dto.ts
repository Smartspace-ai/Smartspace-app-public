import { z } from 'zod';

export enum NotificationTypeDto {
  WorkSpaceUpdated = 0,
  MessageThreadUpdated = 1,
  CommentUpdated = 2,
}

export const NotificationDto = z.object({
  id: z.string(),
  notificationType: z.union([z.nativeEnum(NotificationTypeDto), z.number(), z.string()]),
  description: z.string(),
  workSpaceId: z.string().optional().nullable(),
  threadId: z.string().optional().nullable(),
  createdBy: z.string(),
  createdAt: z.union([z.string(), z.date()]),
  dismissedAt: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

export const NotificationsEnvelopeDto = z.object({
  data: z.array(NotificationDto),
  total: z.number().int().nonnegative().optional(),
  totalUnread: z.number().int().nonnegative().optional(),
});

export type TNotificationDto = z.infer<typeof NotificationDto>;
export type TNotificationsEnvelopeDto = z.infer<typeof NotificationsEnvelopeDto>;





