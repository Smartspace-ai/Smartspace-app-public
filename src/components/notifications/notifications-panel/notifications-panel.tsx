import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useNotificationsContext } from '@/contexts/notifications-context'; // adjust path
import { cn } from '@/lib/utils';
import { Notification, NotificationType } from '@/models/notification';
import { getInitials } from '@/utils/initials';
import { parseDateTimeHuman } from '@/utils/parse-date-time';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, MessageCircle, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function NotificationPanel() {
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const {
    notifications,
    totalUnread,
    handleReadNotification,
    handleMarkAllAsRead,
  } = useNotificationsContext();

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

  const filteredNotifications = showOnlyUnread
    ? notifications.filter((n) => !n.dismissedAt)
    : notifications;

  const handleClickNotification = (notification: Notification) => {
    if (!notification.dismissedAt) {
      handleReadNotification?.(notification.id);
    }

    if (notification.workSpaceId && notification.threadId) {
      const url = `/workspace/${notification.workSpaceId}/thread/${notification.threadId}`;
      navigate(url);
      setTimeout(() => window.location.reload(), 200);
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.MessageThreadUpdated:
        return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />;
      case NotificationType.CommentUpdated:
        return <MessageCircle className="h-3.5 w-3.5 text-purple-500" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <Button
        id="notification-trigger"
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 rounded-full hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4" />
        <AnimatePresence>
          {totalUnread > 0 && (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground shadow-sm"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </motion.span>
          )}
        </AnimatePresence>
        <span className="sr-only">Notifications</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="notification-panel"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full z-50 mt-1 w-[320px] rounded-lg border bg-background shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <h2 className="text-sm font-medium flex items-center gap-1.5">
                Notifications
                {totalUnread > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                    {totalUnread}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">
                  Unread only
                </span>
                <Switch
                  checked={showOnlyUnread}
                  onCheckedChange={setShowOnlyUnread}
                  className="scale-75"
                />
              </div>
            </div>

            {/* Mark all as read */}
            {totalUnread > 0 && (
              <div className="border-b px-3 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-xs text-primary hover:text-primary hover:bg-primary/5 h-7 rounded-md"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </Button>
              </div>
            )}

            {/* List */}
            <ScrollArea className="max-h-[320px]">
              {filteredNotifications.length > 0 ? (
                <div className="py-1">
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'group flex items-start gap-2.5 px-3 py-2 hover:bg-muted/40 transition-all relative cursor-pointer',
                        !notification.dismissedAt && 'bg-primary/5'
                      )}
                      onClick={() => handleClickNotification(notification)}
                    >
                      <Avatar className="h-8 w-8 rounded-full">
                        <AvatarImage
                          src={notification.avatar || '/placeholder.svg'}
                          alt={notification.createdBy}
                        />
                        <AvatarFallback className="text-xs font-medium">
                          {getInitials(notification.createdBy || '')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-medium truncate">
                              {notification.createdBy}
                            </p>
                            {getNotificationIcon(notification.notificationType)}
                          </div>
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap shrink-0">
                            {parseDateTimeHuman(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.description}
                        </p>
                      </div>

                      {!notification.dismissedAt && (
                        <div className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">No notifications</p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">
                    {showOnlyUnread
                      ? "You've read all your notifications"
                      : "You don't have any notifications yet"}
                  </p>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
