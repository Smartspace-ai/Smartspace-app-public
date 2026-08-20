// src/ui/threads/ThreadItem.tsx
import { Bookmark, Edit, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/mui-compat/dropdown-menu';
import { getAvatarColour } from '@/shared/utils/avatarColour';
import { getInitials } from '@/shared/utils/initials';
import { isDraftThreadId } from '@/shared/utils/threadId';

import { parseDateTimeHuman, type MessageThread } from '@smartspace/chat-ui';

import { useThreadItemVm } from './ThreadItem.vm';
import { ThreadRenameModal } from './ThreadRenameModal';

type Props = {
  thread: MessageThread;
};

/** Shown on hover for pointer devices, always shown on touch. */
const revealOnHover =
  'opacity-100 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100';

export default function ThreadItem({ thread }: Props) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const isDraft = isDraftThreadId(thread.id);

  const { goToThread, togglePin, remove, isRunning, isSetPinPending } =
    useThreadItemVm({ thread });
  const { threadId } = useRouteIds();
  const isActive = thread.id === threadId;
  const avatar = getAvatarColour(thread.name);

  const onPointerDown = (e: React.PointerEvent) => {
    // The rename dialog and the row's own menu are children of this element in
    // the React tree, but Radix portals them out of it in the DOM. React still
    // routes their events up the React tree, so a pointer down inside the
    // dialog arrives here — and used to navigate away mid-rename. Anything that
    // did not happen inside the row's own DOM subtree is not the row's click.
    if (e.target instanceof Node && !e.currentTarget.contains(e.target)) return;
    if (
      e.target instanceof Element &&
      (e.target.closest('button') || e.target.closest('[role="menuitem"]'))
    )
      return;
    goToThread();
  };

  return (
    <div
      id={`thread-${thread.id}`}
      role="option"
      aria-selected={isActive}
      tabIndex={0}
      // `chat-thread-item` carries the row's layout, radius, hover and the
      // active teal edge marker from the theme layer.
      className="chat-thread-item group mb-0.5"
      onPointerDown={onPointerDown}
      onKeyDown={(e) => {
        // Same portal story as `onPointerDown`: without this guard every
        // keystroke typed in the rename dialog lands here, Space gets
        // preventDefault'd out of the name field and Enter opens the thread
        // instead of saving the new name.
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToThread();
        }
      }}
    >
      <span
        className="chat-thread-avatar"
        style={{ backgroundColor: avatar.backgroundColor }}
      >
        {getInitials(thread.name)}
      </span>

      <span className="block min-w-0 flex-1">
        <span className="chat-thread-title block truncate">{thread.name}</span>
        <span className="chat-thread-meta mt-0.5 block truncate">
          {isRunning ? (
            <span className="inline-flex items-center gap-1 text-star">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running…
            </span>
          ) : (
            <>
              {thread.totalMessages}{' '}
              {thread.totalMessages === 1 ? 'message' : 'messages'} ·{' '}
              {parseDateTimeHuman(thread.lastUpdatedAt)}
            </>
          )}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePin();
          }}
          aria-label={thread.pinned ? 'Remove bookmark' : 'Bookmark thread'}
          aria-pressed={thread.pinned}
          disabled={isSetPinPending}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded transition-all duration-150 ${
            thread.pinned
              ? 'text-primary opacity-100'
              : `text-muted-foreground hover:text-foreground ${revealOnHover}`
          }`}
        >
          {isSetPinPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bookmark
              className={`h-4 w-4 transition-all ${
                thread.pinned ? 'fill-primary' : 'fill-none'
              }`}
              strokeWidth={thread.pinned ? 0 : 1.75}
            />
          )}
        </button>

        {!isDraft && (
          <DropdownMenu open={isMenuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More options"
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted-foreground transition-all duration-150 hover:text-foreground ${
                  isMenuOpen ? 'opacity-100' : revealOnHover
                }`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-lg p-1">
              <DropdownMenuItem
                className="rounded-md px-2 py-1.5 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  setIsRenameOpen(true);
                }}
              >
                <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                className="rounded-md px-2 py-1.5 text-xs text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  remove();
                }}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </span>

      <ThreadRenameModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        thread={thread}
      />
    </div>
  );
}
