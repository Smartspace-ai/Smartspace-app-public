import { describe, expect, it } from 'vitest';

import {
  mapNotificationDtoToModel,
  mapNotificationsEnvelopeDto,
} from '@/domains/notifications/mapper';
import { NotificationType } from '@/domains/notifications/model';

const baseDto = {
  id: '1',
  description: 'a',
  workSpaceId: null,
  threadId: null,
  createdBy: 'u',
  createdAt: '2024-01-01T00:00:00Z',
  dismissedAt: null,
};

describe('notifications mapper', () => {
  it('maps WorkSpaceUpdated string enum from SDK', () => {
    const n = mapNotificationDtoToModel({
      ...baseDto,
      notificationType: 'WorkSpaceUpdated',
    } as never);
    expect(n.notificationType).toBe(NotificationType.WorkSpaceUpdated);
  });

  it('maps MessageThreadUpdated string enum from SDK', () => {
    const n = mapNotificationDtoToModel({
      ...baseDto,
      notificationType: 'MessageThreadUpdated',
    } as never);
    expect(n.notificationType).toBe(NotificationType.MessageThreadUpdated);
  });

  it('maps CommentUpdated string enum from SDK', () => {
    const n = mapNotificationDtoToModel({
      ...baseDto,
      notificationType: 'CommentUpdated',
    } as never);
    expect(n.notificationType).toBe(NotificationType.CommentUpdated);
  });

  it('falls back to WorkSpaceUpdated for unknown values', () => {
    const n = mapNotificationDtoToModel({
      ...baseDto,
      notificationType: 'unknown',
    } as never);
    expect(n.notificationType).toBe(NotificationType.WorkSpaceUpdated);
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
