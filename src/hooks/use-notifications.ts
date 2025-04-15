import { Notification } from '@/models/notification';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../apis/notifications';

const LIMIT = 10;

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [isUnreadOnly, setIsUnreadOnly] = useState<boolean>(false);
  const [isHasMore, setIsHasMore] = useState<boolean>(true);
  const [newNotification, setNewNotification] = useState<Notification | null>(
    null
  );
  const [page, setPage] = useState<number>(1);

  const isMounted = useRef(true);

  const getNotifications = useCallback(
    async (pageToLoad = 1, reset = false) => {
      try {
        const result = await fetchNotifications(pageToLoad, isUnreadOnly);

        if (!isMounted.current) return;

        const combined = reset
          ? result.items
          : [...notifications, ...result.items];

        const unique = Array.from(
          new Map(combined.map((n) => [n.id, n])).values()
        );

        setNotifications(unique);
        setTotal(result.totalCount);
        setTotalUnread(result.unreadCount ?? 0);
        setIsHasMore(result.items.length === LIMIT);
        setPage(pageToLoad);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    },
    [notifications, isUnreadOnly]
  );

  const handleReadNotification = useCallback(async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, dismissedAt: new Date().toISOString() } : n
        )
      );
      setTotalUnread((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          dismissedAt: new Date().toISOString(),
        }))
      );
      setTotalUnread(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  }, []);

  useEffect(() => {
    getNotifications(1, true);
  }, [isUnreadOnly, getNotifications]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    notifications,
    newNotification,
    total,
    totalUnread,
    isUnreadOnly,
    setIsUnreadOnly,
    isHasMore,
    getNotifications,
    handleReadNotification,
    handleMarkAllAsRead,
  };
};
