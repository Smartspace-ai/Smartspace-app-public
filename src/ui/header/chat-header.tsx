import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import { MessageSquare, PanelLeft, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { useThreadUsers } from '@/domains/thread-users';

import { SidebarTrigger, useSidebar } from '@/shared/ui/mui-compat/sidebar';
import { getInitials } from '@/shared/utils/initials';

import { useThread, useWorkspace } from '@smartspace/chat-ui';

import { AddUsersToThreadDialog } from './add-users-dialog';
import { NotificationPanel } from './notifications-panel';

/** Shared shape for the round icon buttons in the header's action row. */
const iconButtonClass =
  'h-auto w-auto p-2.5 rounded-full transition-colors hover:bg-secondary text-muted-foreground hover:text-muted-foreground';

/** Same shape, filled while the toggled panel is open. */
const iconButtonActiveClass =
  'h-auto w-auto p-2.5 rounded-full transition-colors bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground';

export function ChatHeader() {
  const { workspaceId, threadId } = useRouteIds();
  const { isPending: workspaceLoading, isError: workspaceError } =
    useWorkspace(workspaceId);
  const { data: activeThread } = useThread({ workspaceId, threadId });
  const { data: threadUsers } = useThreadUsers(threadId);
  const { rightOpen } = useSidebar();
  const [addUsersOpen, setAddUsersOpen] = useState(false);
  const canAddUsers = !!workspaceId && !!threadId;

  const participants = threadUsers ?? [];
  const messageCount = activeThread?.totalMessages ?? 0;

  const title = workspaceError
    ? 'Workspace failed to load'
    : activeThread?.name ?? '';

  return (
    <header className="ss-chat__header flex shrink-0 items-start justify-between gap-4 border-b border-border/50 px-8 pt-3 pb-2.5">
      <div className="min-w-0 flex-1">
        {workspaceLoading && !activeThread ? (
          <Skeleton className="h-5 w-56" />
        ) : (
          <h2
            className={`truncate text-[15px] font-semibold leading-snug tracking-tight ${
              workspaceError ? 'text-destructive' : 'text-primary'
            }`}
            title={title}
            key={`thread-title-${activeThread?.id ?? 'none'}`} // Force re-render when thread changes
          >
            {title || '—'}
          </h2>
        )}

        <div className="mt-1 flex items-center gap-1.5">
          {participants.length > 0 && (
            <div className="flex -space-x-1">
              {participants.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  title={user.displayName}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[7px] font-semibold leading-none text-primary-foreground ring-2 ring-background"
                >
                  {getInitials(user.displayName)}
                </div>
              ))}
            </div>
          )}
          {participants.length > 0 && (
            <>
              <span className="text-[11px] text-muted-foreground">
                {participants.length}{' '}
                {participants.length === 1 ? 'participant' : 'participants'}
              </span>
              <span className="text-[11px] text-muted-foreground">·</span>
            </>
          )}
          <span className="text-[11px] text-muted-foreground">
            {messageCount} {messageCount === 1 ? 'message' : 'messages'}
          </span>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-1">
        <SidebarTrigger
          side="left"
          icon={<PanelLeft className="h-5 w-5" />}
          className={iconButtonClass}
        />
        <NotificationPanel />
        {canAddUsers && (
          <Tooltip title="Add users to thread">
            <button
              type="button"
              onClick={() => setAddUsersOpen(true)}
              className={iconButtonClass}
              aria-label="Add users to thread"
            >
              <UserPlus className="h-5 w-5" />
            </button>
          </Tooltip>
        )}
        <SidebarTrigger
          side="right"
          icon={<MessageSquare className="h-5 w-5" />}
          className={rightOpen ? iconButtonActiveClass : iconButtonClass}
        />
      </div>

      {canAddUsers && (
        <AddUsersToThreadDialog
          open={addUsersOpen}
          onClose={() => setAddUsersOpen(false)}
          workspaceId={workspaceId}
          threadId={threadId}
        />
      )}
    </header>
  );
}

export default ChatHeader;
