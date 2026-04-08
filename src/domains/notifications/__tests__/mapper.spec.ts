import { describe, expect, it } from 'vitest';

import {
  mapNotificationDtoToModel,
  mapNotificationsEnvelopeDto,
} from '@/domains/notifications/mapper';
import { NotificationType } from '@/domains/notifications/model';
import { NotificationSchema as notificationSchema } from '@/domains/notifications/schemas';

describe('notifications mapper', () => {
  it('normalizes type from number and string', () => {
    const n1 = mapNotificationDtoToModel({
      id: '1',
      notificationType: 1,
      description: 'a',
      workSpaceId: null,
      threadId: null,
      createdBy: 'u',
      createdAt: '2024',
      dismissedAt: null,
      avatar: null,
    } as any);
    const n2 = mapNotificationDtoToModel({
      id: '2',
      notificationType: '2',
      description: 'b',
      workSpaceId: null,
      threadId: null,
      createdBy: 'u',
      createdAt: '2024',
      dismissedAt: null,
      avatar: null,
    } as any);
    expect(n1.notificationType).toBe(NotificationType.MessageThreadUpdated);
    expect(n2.notificationType).toBe(NotificationType.CommentUpdated);
  });

  it('normalizes numeric 0 to WorkSpaceUpdated', () => {
    const parsed = notificationSchema.parse({
      id: '3',
      notificationType: 0,
      description: 'c',
      workSpaceId: null,
      threadId: null,
      createdBy: 'u',
      createdAt: '2024-01-01T00:00:00Z',
      dismissedAt: null,
      avatar: null,
    });
    expect(mapNotificationDtoToModel(parsed).notificationType).toBe(
      NotificationType.WorkSpaceUpdated
    );
  });

  it('normalizes numeric 2 to CommentUpdated', () => {
    const parsed = notificationSchema.parse({
      id: '4',
      notificationType: 2,
      description: 'd',
      workSpaceId: null,
      threadId: null,
      createdBy: 'u',
      createdAt: '2024-01-01T00:00:00Z',
      dismissedAt: null,
      avatar: null,
    });
    expect(mapNotificationDtoToModel(parsed).notificationType).toBe(
      NotificationType.CommentUpdated
    );
  });

  it('normalizes string "0" to WorkSpaceUpdated', () => {
    const parsed = notificationSchema.parse({
      id: '5',
      notificationType: '0',
      description: 'e',
      workSpaceId: null,
      threadId: null,
      createdBy: 'u',
      createdAt: '2024-01-01T00:00:00Z',
      dismissedAt: null,
      avatar: null,
    });
    expect(mapNotificationDtoToModel(parsed).notificationType).toBe(
      NotificationType.WorkSpaceUpdated
    );
  });

  it('normalizes string "MessageThreadUpdated" to MessageThreadUpdated', () => {
    const parsed = notificationSchema.parse({
      id: '6',
      notificationType: 'MessageThreadUpdated',
      description: 'f',
      workSpaceId: null,
      threadId: null,
      createdBy: 'u',
      createdAt: '2024-01-01T00:00:00Z',
      dismissedAt: null,
      avatar: null,
    });
    expect(mapNotificationDtoToModel(parsed).notificationType).toBe(
      NotificationType.MessageThreadUpdated
    );
  });

  it('falls back to WorkSpaceUpdated for unknown values', () => {
    const parsed = notificationSchema.parse({
      id: '7',
      notificationType: 'unknown',
      description: 'g',
      workSpaceId: null,
      threadId: null,
      createdBy: 'u',
      createdAt: '2024-01-01T00:00:00Z',
      dismissedAt: null,
      avatar: null,
    });
    expect(mapNotificationDtoToModel(parsed).notificationType).toBe(
      NotificationType.WorkSpaceUpdated
    );
  });

  it('falls back to WorkSpaceUpdated for out-of-range numbers', () => {
    const parsed = notificationSchema.parse({
      id: '8',
      notificationType: 99,
      description: 'h',
      workSpaceId: null,
      threadId: null,
      createdBy: 'u',
      createdAt: '2024-01-01T00:00:00Z',
      dismissedAt: null,
      avatar: null,
    });
    expect(mapNotificationDtoToModel(parsed).notificationType).toBe(
      NotificationType.WorkSpaceUpdated
    );
  });

  it('maps envelope with counts', () => {
    const env = mapNotificationsEnvelopeDto({
      data: [],
      total: 5,
      totalUnread: 2,
    } as any);
    expect(env.totalCount).toBe(5);
    expect(env.unreadCount).toBe(2);
  });
});
