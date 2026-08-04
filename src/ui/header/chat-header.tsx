import { useMsal } from '@azure/msal-react';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import {
  LogOut,
  MessageSquare,
  Moon,
  PanelLeft,
  Sun,
  User,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';

import { handleTrailingSlash } from '@/platform/auth/msalConfig';
import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { useThreadUsers } from '@/domains/thread-users';
import { useActiveUser } from '@/domains/users';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/ui/mui-compat/dropdown-menu';
import { SidebarTrigger, useSidebar } from '@/shared/ui/mui-compat/sidebar';
import { getInitials } from '@/shared/utils/initials';

import { useColorScheme } from '@/theme/colorScheme';

import { useThread, useWorkspace } from '@smartspace/chat-ui';

import { AddUsersToThreadDialog } from './add-users-dialog';
import { NotificationPanel } from './notifications-panel';

/** 32px round icon buttons, matching the reference header's action row. */
const iconButton =
  'h-8 w-8 rounded-full inline-flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors';
const iconButtonActive =
  'h-8 w-8 rounded-full inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground transition-colors';

export function ChatHeader() {
  const { workspaceId, threadId } = useRouteIds();
  const { isPending: workspaceLoading, isError: workspaceError } =
    useWorkspace(workspaceId);
  const { data: activeThread } = useThread({ workspaceId, threadId });
  const { data: threadUsers } = useThreadUsers(threadId);
  const { rightOpen } = useSidebar();
  const { isDark, toggle: toggleTheme } = useColorScheme();
  const activeUser = useActiveUser();
  const { instance } = useMsal();
  const [addUsersOpen, setAddUsersOpen] = useState(false);
  const canAddUsers = !!workspaceId && !!threadId;

  const participants = threadUsers ?? [];
  const title = workspaceError
    ? 'Workspace failed to load'
    : activeThread?.name ?? '';

  const handleLogout = () => {
    const account = instance.getActiveAccount();
    if (!account) return;
    instance.logoutRedirect({
      account,
      postLogoutRedirectUri: handleTrailingSlash(window.location.origin),
    });
  };

  return (
    <header className="ss-chat__header flex h-14 shrink-0 items-center gap-4 border-b border-border/60 px-6 max-sm:gap-2 max-sm:px-4">
      {/* Title + participants */}
      <div className="min-w-0 flex-1">
        {workspaceLoading && !activeThread ? (
          <Skeleton className="h-5 w-56" />
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <h1
              className={`truncate text-[15px] font-semibold tracking-tight ${
                workspaceError ? 'text-destructive' : 'text-primary'
              }`}
              title={title}
              key={`thread-title-${activeThread?.id ?? 'none'}`} // Force re-render when thread changes
            >
              {title || '—'}
            </h1>
            {participants.length > 0 && (
              <span className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] text-muted-foreground lg:flex">
                <span className="flex -space-x-1">
                  {participants.slice(0, 4).map((user) => (
                    <span
                      key={user.id}
                      title={user.displayName}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[7px] font-semibold leading-none text-primary-foreground ring-2 ring-background"
                    >
                      {getInitials(user.displayName)}
                    </span>
                  ))}
                </span>
                {participants.length}{' '}
                {participants.length === 1 ? 'participant' : 'participants'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        <SidebarTrigger
          side="left"
          icon={<PanelLeft className="h-4 w-4" />}
          className={`${iconButton} h-8 w-8 p-0`}
        />

        <SidebarTrigger
          side="right"
          icon={<MessageSquare className="h-4 w-4" />}
          className={`${rightOpen ? iconButtonActive : iconButton} h-8 w-8 p-0`}
        />

        <NotificationPanel />

        {canAddUsers && (
          <Tooltip title="Add users to thread">
            <button
              type="button"
              onClick={() => setAddUsersOpen(true)}
              className={iconButton}
              aria-label="Add users to thread"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </Tooltip>
        )}

        {/* Account — holds the appearance toggle and log out, as in the design */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={iconButton} aria-label="Account">
              <User className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[240px] p-4">
            <p
              className="truncate text-sm text-foreground"
              title={activeUser.email}
            >
              {activeUser.email}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {activeUser.name}
            </p>
            <hr className="my-3 border-border" />
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">Appearance</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
                {isDark ? 'Light' : 'Dark'}
              </button>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </DropdownMenuContent>
        </DropdownMenu>
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
