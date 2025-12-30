import { describe, expect, it, vi } from 'vitest';

import { apiParsed } from '@/platform/apiParsed';

import { fetchNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '@/domains/notifications/service';

describe('notifications service', () => {
  it('fetchNotifications returns sorted items and counts', async () => {
    const env = {
      data: [
        { id: '2', notificationType: 0, description: 'b', workSpaceId: null, threadId: null, createdBy: 'u', createdAt: '2024-01-02', dismissedAt: null, avatar: null },
        { id: '1', notificationType: 1, description: 'a', workSpaceId: null, threadId: null, createdBy: 'u', createdAt: '2024-01-01', dismissedAt: null, avatar: null },
      ],
      total: 2,
      totalUnread: 1,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed, 'get').mockResolvedValueOnce(env as any);
    const res = await fetchNotifications(1, false, 10);
    expect(res.items[0].id).toBe('2');
    expect(res.totalCount).toBe(2);
    expect(res.unreadCount).toBe(1);
    spy.mockRestore();
  });

  it('markNotificationAsRead delegates to apiParsed.put', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed, 'put').mockResolvedValueOnce(undefined as any);
    await expect(markNotificationAsRead('n1')).resolves.toBeUndefined();
    spy.mockRestore();
  });

  it('markAllNotificationsAsRead delegates to apiParsed.put', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(apiParsed, 'put').mockResolvedValueOnce(undefined as any);
    await expect(markAllNotificationsAsRead()).resolves.toBeUndefined();
    spy.mockRestore();
  });
});


