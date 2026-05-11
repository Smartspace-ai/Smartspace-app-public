import { describe, expect, it, vi } from 'vitest';

const { mockGet, mockPutUpdate, mockPutUpdateAll } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPutUpdate: vi.fn(),
  mockPutUpdateAll: vi.fn(),
}));

vi.mock('@smartspace/api-client', () => ({
  ChatApi: {
    getSmartSpaceChatAPI: () => ({
      notificationGet: mockGet,
      notificationPutUpdate: mockPutUpdate,
      notificationPutUpdateall: mockPutUpdateAll,
    }),
  },
  ChatZod: {
    notificationGetResponse: {},
  },
  AXIOS_INSTANCE: {},
}));
vi.mock('@/platform/validation', () => ({
  parseOrThrow: vi.fn((_schema: unknown, data: unknown) => data),
}));

import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/domains/notifications/service';

describe('notifications service', () => {
  it('fetchNotifications returns sorted items and counts', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: '2',
            notificationType: 'WorkSpaceUpdated',
            description: 'b',
            workSpaceId: null,
            threadId: null,
            createdBy: 'u',
            createdAt: '2024-01-02T00:00:00Z',
            dismissedAt: null,
          },
          {
            id: '1',
            notificationType: 'MessageThreadUpdated',
            description: 'a',
            workSpaceId: null,
            threadId: null,
            createdBy: 'u',
            createdAt: '2024-01-01T00:00:00Z',
            dismissedAt: null,
          },
        ],
        total: 2,
        totalUnread: 1,
      },
    });
    const res = await fetchNotifications(1, false, 10);
    expect(res.items[0].id).toBe('2');
    expect(res.totalCount).toBe(2);
    expect(res.unreadCount).toBe(1);
  });

  it('markNotificationAsRead delegates to SDK', async () => {
    mockPutUpdate.mockResolvedValueOnce({});
    await expect(markNotificationAsRead('n1')).resolves.toBeUndefined();
    expect(mockPutUpdate).toHaveBeenCalledWith(['n1']);
  });

  it('markAllNotificationsAsRead delegates to SDK', async () => {
    mockPutUpdateAll.mockResolvedValueOnce({});
    await expect(markAllNotificationsAsRead()).resolves.toBeUndefined();
    expect(mockPutUpdateAll).toHaveBeenCalled();
  });
});
