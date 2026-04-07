import { describe, expect, it, vi } from 'vitest';

import { api } from '@/platform/api';

import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/domains/notifications/service';

vi.mock('@/platform/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('notifications service', () => {
  it('fetchNotifications returns sorted items and counts', async () => {
    const env = {
      data: [
        {
          id: '2',
          notificationType: 0,
          description: 'b',
          workSpaceId: null,
          threadId: null,
          createdBy: 'u',
          createdAt: '2024-01-02T00:00:00Z',
          dismissedAt: null,
          avatar: null,
        },
        {
          id: '1',
          notificationType: 1,
          description: 'a',
          workSpaceId: null,
          threadId: null,
          createdBy: 'u',
          createdAt: '2024-01-01T00:00:00Z',
          dismissedAt: null,
          avatar: null,
        },
      ],
      total: 2,
      totalUnread: 1,
    };
    vi.mocked(api.get).mockResolvedValueOnce(env);
    const res = await fetchNotifications(1, false, 10);
    expect(res.items[0].id).toBe('2');
    expect(res.totalCount).toBe(2);
    expect(res.unreadCount).toBe(1);
  });

  it('markNotificationAsRead delegates to api.put', async () => {
    vi.mocked(api.put).mockResolvedValueOnce(undefined);
    await expect(markNotificationAsRead('n1')).resolves.toBeUndefined();
    expect(api.put).toHaveBeenCalledWith('/notification/update', ['n1']);
  });

  it('markAllNotificationsAsRead delegates to api.put', async () => {
    vi.mocked(api.put).mockResolvedValueOnce(undefined);
    await expect(markAllNotificationsAsRead()).resolves.toBeUndefined();
    expect(api.put).toHaveBeenCalledWith('/notification/updateall');
  });
});
