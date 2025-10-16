import { z } from 'zod';

export enum NotificationType {
  WorkSpaceUpdated = 0,
  MessageThreadUpdated = 1,
  CommentUpdated = 2,
}

// (optional) perms map you already had
export const notificationEntityTypeAccept = {
  admin: [NotificationType.WorkSpaceUpdated],
} as const;

// Coerce/normalize the type coming from number|string|enum
export const normalizeNotificationType = (value: unknown): NotificationType => {
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
    if (Number.isFinite(numeric)) return normalizeNotificationType(numeric);
  }
  return NotificationType.WorkSpaceUpdated;
};

/**
 * Accept PascalCase or camelCase keys from the API and coerce fields.
 * `createdAt` is transformed to a Date for easier sorting/formatting.
 */
export const NotificationSchema = z.preprocess((input) => {
  if (!input || typeof input !== 'object') return input;
  const anyInput = input as Record<string, unknown>;
  return {
    id: anyInput.id ?? anyInput.Id,
    notificationType: anyInput.notificationType ?? anyInput.NotificationType,
    description: anyInput.description ?? anyInput.Description,
    workSpaceId: anyInput.workSpaceId ?? anyInput.WorkSpaceId,
    threadId: anyInput.threadId ?? anyInput.ThreadId,
    createdBy: anyInput.createdBy ?? anyInput.CreatedBy,
    createdAt: anyInput.createdAt ?? anyInput.CreatedAt,
    dismissedAt: anyInput.dismissedAt ?? anyInput.DismissedAt,
    avatar: anyInput.avatar ?? anyInput.Avatar,
  };
}, z.object({
  id: z.string(),
  notificationType: z.union([z.nativeEnum(NotificationType), z.number(), z.string()])
    .transform((v) => normalizeNotificationType(v)),
  description: z.string(),
  workSpaceId: z.string().optional().nullable(),
  threadId: z.string().optional().nullable(),
  createdBy: z.string(),
  createdAt: z.union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v : new Date(v))),
  dismissedAt: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
}).strict());

export type Notification = z.infer<typeof NotificationSchema>;

/** Envelope the API returns for list endpoints */
export const NotificationsEnvelopeSchema = z.object({
  data: z.array(NotificationSchema),
  total: z.number().int().nonnegative().optional(),
  totalUnread: z.number().int().nonnegative().optional(),
}).passthrough();

export type NotificationsEnvelope = z.infer<typeof NotificationsEnvelopeSchema>;
