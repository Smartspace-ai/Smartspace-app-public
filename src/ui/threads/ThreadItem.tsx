// src/ui/threads/ThreadItem.tsx
import { useNavigate } from '@tanstack/react-router';
import { Edit, Loader2, MoreHorizontal, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import type { MessageThread } from '@/domains/threads';

import { CircleInitials } from '@/shared/components/circle-initials';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { Button } from '@/shared/ui/mui-compat/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/mui-compat/dropdown-menu';
import { parseDateTimeHuman } from '@/shared/utils/parseDateTime';
import { NEW_THREAD_ID } from '@/shared/utils/threadId';

import { useThreadItemVm } from './ThreadItem.vm';

type Props = {
  thread: MessageThread;
};

export default function ThreadItem({ thread }: Props) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const isNewThreadRow = thread.id === NEW_THREAD_ID;
  const navigate = useNavigate();

  const {
    goToThread,
    toggleFavorite,
    remove,
    isRunning,
    isSetFavoritePending,
    prefetchThreadDetail,
    prefetchThreadDetailDebounced,
  } = useThreadItemVm({ thread });
  const { threadId, isNewThreadRoute } = useRouteIds();
  const isActive =
    (isNewThreadRow && isNewThreadRoute) ||
    (!isNewThreadRow && thread.id === threadId && !!threadId);
  const isMobile = useIsMobile();

  const onPointerDown = (e: React.PointerEvent) => {
    if (
      e.target instanceof Element &&
      (e.target.closest('button') || e.target.closest('[role="menuitem"]'))
    )
      return;
    if (!isNewThreadRow) prefetchThreadDetail();
    goToThread();
  };

  const onMouseEnter = () => {
    if (!isMobile && !isNewThreadRow) prefetchThreadDetailDebounced();
  };

  return (
    <div
      id={`thread-${thread.id}`}
      className={`group relative flex items-start gap-2.5 p-2.5 hover:bg-accent cursor-pointer transition-all rounded-lg ${
        isActive ? 'bg-accent' : ''
      }`}
      onPointerDown={onPointerDown}
      onMouseEnter={onMouseEnter}
    >
      <CircleInitials
        className={
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-gray-300 text-gray-700'
        }
        text={thread.name}
        colored={false}
      />

      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-medium truncate">{thread.name}</h3>
        <div className="text-[11px] gap-x-2 mt-0.5 flex flex-row items-center">
          <div>
            {thread.totalMessages}{' '}
            {thread.totalMessages === 1 ? 'message' : 'messages'}
          </div>
          {isRunning ? (
            <div className="text-amber-500 font-medium flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-xs">Running…</p>
            </div>
          ) : isNewThreadRow ? (
            <div className="text-muted-foreground">New</div>
          ) : (
            <div>{parseDateTimeHuman(thread.lastUpdatedAt)}</div>
          )}
          <div className="flex-grow" />
          {isSetFavoritePending && !isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : thread.favorited ? (
            <Star className="h-4 w-4 text-amber-500" />
          ) : null}
        </div>
      </div>

      {!isNewThreadRow && (
        <DropdownMenu open={isMenuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 absolute right-1.5 top-1.5 p-0 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-lg p-1 shadow-lg border-gray-100"
          >
            <DropdownMenuItem
              className="text-xs py-1.5 px-2 rounded-md"
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite();
                setMenuOpen(false);
              }}
            >
              <Star className="mr-2 h-3.5 w-3.5 text-amber-400" />
              <span>
                {thread.favorited
                  ? 'Remove from favorites'
                  : 'Add to favorites'}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs py-1.5 px-2 rounded-md"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                const wsId = thread.workSpaceId;
                if (wsId) {
                  navigate({
                    to: '/workspace/$workspaceId/thread/$threadId',
                    params: { workspaceId: wsId, threadId: thread.id },
                    search: { modal: 'rename', targetId: thread.id },
                    replace: false,
                  });
                }
              }}
            >
              <Edit className="mr-2 h-3.5 w-3.5 text-gray-500" />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-gray-100" />
            <DropdownMenuItem
              className="text-xs py-1.5 px-2 rounded-md text-red-500"
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
  );
}
