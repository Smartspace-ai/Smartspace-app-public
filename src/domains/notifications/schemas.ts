import { z } from 'zod';

import { DateFromApi } from '@/shared/utils/dateFromApi';

import { NotificationType } from './model';

const normalizeNotificationType = (value: unknown): NotificationType => {
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
    if (Number.isFinite(numeric)) return normalizeNotificationType(numeric);
  }
  return NotificationType.WorkSpaceUpdated;
};

export const notificationSchema = z.object({
  id: z.string(),
  notificationType: z
    .union([z.nativeEnum(NotificationType), z.number(), z.string()])
    .transform((v) => normalizeNotificationType(v)),
  description: z.string(),
  workSpaceId: z.string().optional().nullable(),
  threadId: z.string().optional().nullable(),
  createdBy: z.string(),
  createdAt: DateFromApi,
  dismissedAt: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

export const notificationsEnvelopeSchema = z.object({
  data: z.array(notificationSchema),
  total: z.number().int().nonnegative().optional(),
  totalUnread: z.number().int().nonnegative().optional(),
});

export type NotificationDto = z.input<typeof notificationSchema>;
export type NotificationsEnvelopeDto = z.input<
  typeof notificationsEnvelopeSchema
>;
