import { cn } from '@/lib/utils';
import {
  Bell,
  Check,
  FileText,
  Info,
  MessageSquare,
  Settings,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import { Switch } from '../../ui/switch';

export type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'message' | 'mention' | 'update' | 'system' | 'invite';
};

type NotificationsPanelProps = {
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NotificationsPanel({
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onDismiss,
  open,
  onOpenChange,
}: NotificationsPanelProps) {
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const filteredNotifications = showOnlyUnread
    ? notifications.filter((notification) => !notification.read)
    : notifications;

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'mention':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'update':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-orange-500" />;
      case 'invite':
        return <User className="h-4 w-4 text-pink-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div
      className={cn(
        'absolute right-4 top-14 w-80 rounded-lg border bg-white shadow-lg z-50 transition-all duration-200 ease-in-out',
        open
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-95 pointer-events-none'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-sm font-medium">Notifications</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Show only unread</span>
          <Switch
            checked={showOnlyUnread}
            onCheckedChange={setShowOnlyUnread}
          />
        </div>
      </div>

      {unreadCount > 0 && (
        <div className="p-2 flex justify-center border-b">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-gray-900 w-full"
            onClick={onMarkAllAsRead}
          >
            Mark all as read
          </Button>
        </div>
      )}

      <ScrollArea className="max-h-[400px]">
        {filteredNotifications.length > 0 ? (
          <div className="py-1">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors',
                  !notification.read && 'bg-blue-50/50'
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {notification.description}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-gray-900"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <Check className="h-3 w-3" />
                      <span className="sr-only">Mark as read</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-gray-900"
                    onClick={() => onDismiss(notification.id)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Dismiss</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">There are no notifications</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
