import { useMsal } from '@azure/msal-react';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import {
  ChevronDown,
  Database,
  LogOut,
  MessageSquare,
  Moon,
  PanelLeft,
  Pencil,
  Sun,
  User,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';

import { handleTrailingSlash } from '@/platform/auth/msalConfig';
import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { useThreadUsers } from '@/domains/thread-users';
import { useActiveUser } from '@/domains/users';

import { ThreadRenameModal } from '@/ui/threads/ThreadRenameModal';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/ui/mui-compat/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/mui-compat/popover';
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
  const {
    data: activeWorkspace,
    isPending: workspaceLoading,
    isError: workspaceError,
  } = useWorkspace(workspaceId);
  const { data: activeThread } = useThread({ workspaceId, threadId });
  const { data: threadUsers } = useThreadUsers(threadId);
  const { rightOpen } = useSidebar();
  const { isDark, toggle: toggleTheme } = useColorScheme();
  const activeUser = useActiveUser();
  const { instance } = useMsal();
  const [addUsersOpen, setAddUsersOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const canAddUsers = !!workspaceId && !!threadId;
  const canRename = !!activeThread && !workspaceError;

  const participants = threadUsers ?? [];
  // Workspace tags are the closest thing the app has to the design's
  // "workspace knowledge" strip. Rendered only when the workspace has any.
  const tags = (activeWorkspace?.tags ?? []).filter(Boolean);
  const visibleTags = tags.slice(0, 2);
  const overflowTags = tags.length - visibleTags.length;
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
          <div className="group flex min-w-0 items-center gap-2">
            <h1
              className={`min-w-0 truncate text-[15px] font-semibold tracking-tight ${
                workspaceError ? 'text-destructive' : 'text-primary'
              }`}
              key={`thread-title-${activeThread?.id ?? 'none'}`} // Force re-render when thread changes
            >
              {canRename ? (
                <button
                  type="button"
                  onClick={() => setRenameOpen(true)}
                  title="Click to rename"
                  className="block w-full cursor-text truncate text-left"
                >
                  {title || '—'}
                </button>
              ) : (
                <span className="block truncate" title={title}>
                  {title || '—'}
                </span>
              )}
            </h1>

            {canRename && (
              <button
                type="button"
                onClick={() => setRenameOpen(true)}
                aria-label="Rename thread"
                // Reveal-on-hover only where a hover pointer exists; on touch
                // the pencil stays visible so renaming is reachable.
                className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}

            {participants.length > 0 && (
              <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] text-muted-foreground">
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
                <span className="max-md:hidden">
                  {participants.length}{' '}
                  {participants.length === 1 ? 'participant' : 'participants'}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Workspace knowledge — the app's workspace tags, hidden when there
          are none rather than showing an empty strip. */}
      {tags.length > 0 && (
        <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
          <Database className="h-3 w-3 text-muted-foreground" aria-hidden />
          <span className="sr-only">Workspace knowledge</span>
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex max-w-[140px] items-center truncate whitespace-nowrap rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
              title={tag}
            >
              {tag}
            </span>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-0.5 whitespace-nowrap px-1 py-0.5 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
              >
                {overflowTags > 0 ? `+${overflowTags} more` : 'Details'}
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Workspace knowledge
              </p>
              <ul className="space-y-1.5">
                {tags.map((tag) => (
                  <li key={tag} className="truncate text-sm font-medium">
                    {tag}
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
                This workspace can only retrieve from these sources. Configured
                by your admin.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      )}

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

      {activeThread && (
        <ThreadRenameModal
          isOpen={renameOpen}
          onClose={() => setRenameOpen(false)}
          thread={activeThread}
        />
      )}

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
