import { Dispatch, SetStateAction } from 'react';
import { Notification } from '../models/notification';

export interface NotificationsContextType {
  notifications: Notification[];
  handleMarkAllAsRead: () => void;
  handleReadNotification?: (id: string) => void;
  isHasMore: boolean;
  totalUnread: number;
  isUnreadOnly: boolean;
  setIsUnreadOnly: Dispatch<SetStateAction<boolean>>;
  getNotifications: (page: number) => Promise<void>;
}
