// src/ui/threads/ThreadItem.tsx
import { Bookmark, Edit, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { CircleInitials } from '@/shared/components/circle-initials';
import { Button } from '@/shared/ui/mui-compat/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/mui-compat/dropdown-menu';
import { isDraftThreadId } from '@/shared/utils/threadId';

import { parseDateTimeHuman, type MessageThread } from '@smartspace/chat-ui';

import { useThreadItemVm } from './ThreadItem.vm';
import { ThreadRenameModal } from './ThreadRenameModal';

type Props = {
  thread: MessageThread;
};

export default function ThreadItem({ thread }: Props) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const isDraft = isDraftThreadId(thread.id);

  const { goToThread, togglePin, remove, isRunning, isSetPinPending } =
    useThreadItemVm({ thread });
  const { threadId } = useRouteIds();
  const isActive = thread.id === threadId;

  const onPointerDown = (e: React.PointerEvent) => {
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
      className={`group relative mb-0.5 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3.5 text-left transition-all duration-150 ${
        isActive ? 'bg-secondary shadow-sm' : 'hover:bg-secondary/50'
      }`}
      onPointerDown={onPointerDown}
    >
      <CircleInitials
        className="h-10 w-10 min-w-[40px] text-xs font-semibold shadow-none"
        text={thread.name}
        colored
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {thread.name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {thread.totalMessages}{' '}
          {thread.totalMessages === 1 ? 'message' : 'messages'}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {isRunning ? (
          <span className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-star">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Running…
          </span>
        ) : (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {parseDateTimeHuman(thread.lastUpdatedAt)}
          </span>
        )}

        <div className="flex h-5 items-center gap-0.5">
          {isSetPinPending && !isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : thread.pinned ? (
            <Bookmark className="h-4 w-4 fill-primary text-primary" />
          ) : null}

          {!isDraft && (
            <DropdownMenu open={isMenuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-5 w-5 rounded p-0 text-muted-foreground transition-opacity hover:bg-transparent hover:text-foreground ${
                    isMenuOpen
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                  }`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-lg border p-1 shadow-lg"
              >
                <DropdownMenuItem
                  className="rounded-md px-2 py-1.5 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    togglePin();
                    setMenuOpen(false);
                  }}
                >
                  <Bookmark className="mr-2 h-3.5 w-3.5 text-primary" />
                  <span>{thread.pinned ? 'Unpin thread' : 'Pin thread'}</span>
                </DropdownMenuItem>
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
        </div>
      </div>

      <ThreadRenameModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        thread={thread}
      />
    </div>
  );
}
