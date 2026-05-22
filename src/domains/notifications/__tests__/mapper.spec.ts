import { describe, expect, it } from 'vitest';

import {
  mapNotificationDtoToModel,
  mapNotificationsEnvelopeDto,
} from '@/domains/notifications/mapper';
import { NotificationType } from '@/domains/notifications/model';

import { makeNotificationDto } from '@/test/factories';

describe('notifications mapper', () => {
  it('maps WorkSpaceUpdated string enum from SDK', () => {
    const n = mapNotificationDtoToModel(
      makeNotificationDto({ notificationType: 'WorkSpaceUpdated' })
    );
    expect(n.notificationType).toBe(NotificationType.WorkSpaceUpdated);
  });

  it('maps MessageThreadUpdated string enum from SDK', () => {
    const n = mapNotificationDtoToModel(
      makeNotificationDto({ notificationType: 'MessageThreadUpdated' })
    );
    expect(n.notificationType).toBe(NotificationType.MessageThreadUpdated);
  });

  it('maps CommentUpdated string enum from SDK', () => {
    const n = mapNotificationDtoToModel(
      makeNotificationDto({ notificationType: 'CommentUpdated' })
    );
    expect(n.notificationType).toBe(NotificationType.CommentUpdated);
  });

  it('falls back to WorkSpaceUpdated for unknown values', () => {
    const n = mapNotificationDtoToModel(
      makeNotificationDto({ notificationType: 'unknown' as never })
    );
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
