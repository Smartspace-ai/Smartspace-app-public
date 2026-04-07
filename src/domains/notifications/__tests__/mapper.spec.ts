import { describe, expect, it } from 'vitest';

import {
  mapNotificationDtoToModel,
  mapNotificationsEnvelopeDto,
} from '@/domains/notifications/mapper';
import { NotificationType } from '@/domains/notifications/model';
import { notificationSchema } from '@/domains/notifications/schemas';

describe('notifications mapper', () => {
  it('maps a parsed notification DTO to domain model', () => {
    const parsed = notificationSchema.parse({
      id: '1',
      notificationType: 1,
      description: 'a',
      workSpaceId: null,
      threadId: null,
      createdBy: 'u',
      createdAt: '2024-01-01T00:00:00Z',
      dismissedAt: null,
      avatar: null,
    });
    const model = mapNotificationDtoToModel(parsed);
    expect(model.notificationType).toBe(NotificationType.MessageThreadUpdated);
    expect(model.createdAt).toBeInstanceOf(Date);
  });

  it('normalizes string notification type via schema', () => {
    const parsed = notificationSchema.parse({
      id: '2',
      notificationType: 'CommentUpdated',
      description: 'b',
      workSpaceId: null,
      threadId: null,
      createdBy: 'u',
      createdAt: '2024-01-01T00:00:00Z',
      dismissedAt: null,
      avatar: null,
    });
    const model = mapNotificationDtoToModel(parsed);
    expect(model.notificationType).toBe(NotificationType.CommentUpdated);
  });

  it('maps envelope with counts', () => {
    const env = mapNotificationsEnvelopeDto({
      data: [],
      total: 5,
      totalUnread: 2,
    });
    expect(env.totalCount).toBe(5);
    expect(env.unreadCount).toBe(2);
  });
});
