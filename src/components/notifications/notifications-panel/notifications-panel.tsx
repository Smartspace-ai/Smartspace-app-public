import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNotifications } from '../../../contexts/notifications-context';

export function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotifications();

  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const panel = document.getElementById('notification-panel');
      const button = document.getElementById('notification-trigger');

      if (
        panel &&
        !panel.contains(event.target as Node) &&
        button &&
        !button.contains(event.target as Node) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filter notifications based on the toggle state
  const filteredNotifications = showOnlyUnread
    ? notifications.filter((notification: any) => !notification.read)
    : notifications;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        id="notification-trigger"
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          id="notification-panel"
          className="absolute right-0 top-full z-50 mt-1 w-80 rounded-md border bg-background shadow-lg"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-medium">Notifications</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Show only unread
              </span>
              <Switch
                checked={showOnlyUnread}
                onCheckedChange={setShowOnlyUnread}
              />
            </div>
          </div>

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <div className="border-b px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-primary hover:text-primary hover:bg-primary/5"
                onClick={markAllAsRead}
              >
                Mark all as read {unreadCount > 0 && `(${unreadCount})`}
              </Button>
            </div>
          )}

          {/* Notification List */}
          <ScrollArea className="max-h-[400px]">
            {filteredNotifications.length > 0 ? (
              <div className="py-1">
                {filteredNotifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors relative cursor-pointer',
                      !notification.read && 'bg-primary/5'
                    )}
                    onClick={() =>
                      !notification.read && markAsRead(notification.id)
                    }
                  >
                    {/* User Avatar */}
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={notification.sender?.avatar || '/placeholder.svg'}
                        alt={notification.sender?.name}
                      />
                      <AvatarFallback>
                        {notification.sender?.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {notification.sender?.name}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {notification.createdAt}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.content}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {showOnlyUnread
                    ? 'No unread notifications'
                    : 'No notifications'}
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
