import { INotification } from '../../models/notification/notification';
import { useEffect, useRef, useState } from 'react';
import { getNotificationsList } from '../../apis/notifications';

const LIMIT = 10;

export const useGetNotificationsList = () => {
  const [notifications, setNotifications] = useState<
    INotification[] | undefined
  >(undefined);

  const [isUnreadOnly, setIsUnreadOnly] = useState<boolean>(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [isHasMore, setIsHasMore] = useState<boolean>(true);
  const isMounted = useRef(true);

  const getNotifications = async (newPage: number, isResetData?: boolean) => {
    try {
      if (isMounted.current) {
        const isReset = isResetData ?? newPage === 1;
        const res = await getNotificationsList(newPage, isUnreadOnly);
        setNotifications((prevState) => {
          if (prevState && !isReset) {
            return [...prevState, ...res.data] as INotification[];
          }
          return res.data as INotification[];
        });
        const totalNotificationsOnThisPage = res.data.length;
        const isHasMore =
          totalNotificationsOnThisPage > 0 &&
          totalNotificationsOnThisPage === LIMIT;
        setIsHasMore(isHasMore);
        setTotal(res.total);
        setTotalUnread(res.totalUnread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    getNotifications(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnreadOnly]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    notifications,
    getNotifications,
    totalUnread,
    setTotalUnread,
    total,
    isUnreadOnly,
    setIsUnreadOnly,
    isHasMore,
  };
};
