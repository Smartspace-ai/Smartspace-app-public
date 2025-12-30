import { describe, expect, it } from 'vitest';

import { mapNotificationDtoToModel, mapNotificationsEnvelopeDto } from '@/domains/notifications/mapper';
import { NotificationType } from '@/domains/notifications/model';

describe('notifications mapper', () => {
  it('normalizes type from number and string', () => {
    const n1 = mapNotificationDtoToModel({ id: '1', notificationType: 1, description: 'a', workSpaceId: null, threadId: null, createdBy: 'u', createdAt: '2024', dismissedAt: null, avatar: null } as any);
    const n2 = mapNotificationDtoToModel({ id: '2', notificationType: '2', description: 'b', workSpaceId: null, threadId: null, createdBy: 'u', createdAt: '2024', dismissedAt: null, avatar: null } as any);
    expect(n1.notificationType).toBe(NotificationType.MessageThreadUpdated);
    expect(n2.notificationType).toBe(NotificationType.CommentUpdated);
  });

  it('maps envelope with counts', () => {
    const env = mapNotificationsEnvelopeDto({ data: [], total: 5, totalUnread: 2 } as any);
    expect(env.totalCount).toBe(5);
    expect(env.unreadCount).toBe(2);
  });
});
