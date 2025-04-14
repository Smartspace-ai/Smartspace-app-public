import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { Notification } from '../components/notifications/notifications-panel/notifications-panel';

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, 'id' | 'read' | 'time'>
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
};

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

// Static demo data
const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'New message from Sarah',
    description: 'Hey, can you review the latest design changes?',
    time: '5 minutes ago',
    read: false,
    type: 'message',
  },
  {
    id: '2',
    title: 'You were mentioned in Design System Updates',
    description: '@johndoe please provide feedback on the new color palette',
    time: '1 hour ago',
    read: false,
    type: 'mention',
  },
  {
    id: '3',
    title: 'Project X has been updated',
    description: 'New version 2.3.0 has been released with 5 new features',
    time: '3 hours ago',
    read: true,
    type: 'update',
  },
  {
    id: '4',
    title: 'System maintenance scheduled',
    description: 'The system will be down for maintenance on Sunday at 2 AM',
    time: 'Yesterday',
    read: true,
    type: 'system',
  },
  {
    id: '5',
    title: 'Team Alpha invited you to collaborate',
    description: "You've been invited to join the Marketing project",
    time: '2 days ago',
    read: false,
    type: 'invite',
  },
];

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Add a new notification
  const addNotification = (
    notification: Omit<Notification, 'id' | 'read' | 'time'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      time: 'Just now',
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };

  // Mark a single notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Remove a single notification
  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Simulate new notifications occasionally for demo purposes
  useEffect(() => {
    const types: Notification['type'][] = [
      'message',
      'mention',
      'update',
      'system',
      'invite',
    ];
    const titles = [
      'New design feedback',
      'Project deadline updated',
      'Team meeting scheduled',
      'New comment on your post',
      'System update available',
    ];
    const descriptions = [
      'Please review the latest changes to the dashboard',
      'The deadline has been extended to next Friday',
      'Weekly sync scheduled for tomorrow at 10 AM',
      'Jane left a comment on your recent post',
      'Version 3.2 is now available for installation',
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const i = Math.floor(Math.random() * 5);
        addNotification({
          title: titles[i],
          description: descriptions[i],
          type: types[i],
        });
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

// Hook to consume the notifications context
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationsProvider'
    );
  }
  return context;
};
