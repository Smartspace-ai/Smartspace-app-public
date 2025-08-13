import {
  createContext,
  useContext,
  useMemo,
  type FC,
  type ReactNode,
} from 'react';
import { useNotifications } from '../hooks/data/use-notifications-list';
import { NotificationsContextType } from '../interfaces/notification-type';

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

export const useNotificationsContext = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      'useNotificationsContext must be used within a NotificationsProvider'
    );
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: FC<NotificationsProviderProps> = ({
  children,
}) => {
  const {
    notifications,
    newNotification,
    handleMarkAllAsRead,
    handleReadNotification,
    totalUnread,
    isUnreadOnly,
    setIsUnreadOnly,
    getNotifications,
    isHasMore,
  } = useNotifications();

  const contextValue = useMemo<NotificationsContextType>(
    () => ({
      notifications,
      newNotification,
      handleMarkAllAsRead,
      totalUnread,
      handleReadNotification,
      isUnreadOnly,
      setIsUnreadOnly,
      getNotifications,
      isHasMore,
    }),
    [
      notifications,
      newNotification,
      handleMarkAllAsRead,
      totalUnread,
      handleReadNotification,
      isUnreadOnly,
      setIsUnreadOnly,
      getNotifications,
      isHasMore,
    ]
  );

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};
