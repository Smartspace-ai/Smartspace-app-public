// src/ui/threads/ThreadItem.tsx
import { Edit, Loader2, MoreHorizontal, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { MessageThread } from '@/domains/threads';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { CircleInitials } from '@/shared/components/circle-initials';
import { Button } from '@/shared/ui/mui-compat/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/shared/ui/mui-compat/dropdown-menu';

import { useThreadItemVm } from './ThreadItem.vm';
import { ThreadRenameModal } from './ThreadRenameModal';

type Props = {
  thread: MessageThread;
};

export default function ThreadItem({ thread }: Props) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);

  const { goToThread, toggleFavorite, remove, isRunning, isSetFavoritePending } =
    useThreadItemVm({ thread });
  const { threadId } = useRouteIds();
  const isActive = thread.id === threadId;

  const onPointerDown = (e: React.PointerEvent) => {
    if (
      e.target instanceof Element &&
      (e.target.closest('button') || e.target.closest('[role="menuitem"]'))
    ) return;
    goToThread();
  };

  return (
    <div
      id={`thread-${thread.id}`}
      className={`group relative flex items-start gap-2.5 p-2.5 hover:bg-accent cursor-pointer transition-all rounded-lg ${isActive ? 'bg-accent' : ''}`}
      onPointerDown={onPointerDown}
    >
      <CircleInitials
        className={isActive ? 'bg-primary text-primary-foreground' : 'bg-gray-300 text-gray-700'}
        text={thread.name}
        colored={false}
      />

      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-medium truncate">{thread.name}</h3>
        <div className="text-[11px] gap-x-2 mt-0.5 flex flex-row items-center">
          <div>{thread.totalMessages} {thread.totalMessages === 1 ? 'message' : 'messages'}</div>
          {isRunning ? (
            <div className="text-amber-500 font-medium flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-xs">Running…</p>
            </div>
          ) : (
            <div>{thread.lastUpdated}</div>
          )}
          <div className="flex-grow" />
          {isSetFavoritePending && !isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : thread.favorited ? (
            <Star className="h-4 w-4 text-amber-500" />
          ) : null}
        </div>
      </div>

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
        <DropdownMenuContent align="end" className="w-48 rounded-lg p-1 shadow-lg border-gray-100">
          <DropdownMenuItem
            className="text-xs py-1.5 px-2 rounded-md"
            onClick={(e) => { e.preventDefault(); toggleFavorite(); setMenuOpen(false); }}
          >
            <Star className="mr-2 h-3.5 w-3.5 text-amber-400" />
            <span>{thread.favorited ? 'Remove from favorites' : 'Add to favorites'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs py-1.5 px-2 rounded-md"
            onClick={(e) => { e.preventDefault(); setIsRenameOpen(true); }}
          >
            <Edit className="mr-2 h-3.5 w-3.5 text-gray-500" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 bg-gray-100" />
          <DropdownMenuItem
            className="text-xs py-1.5 px-2 rounded-md text-red-500"
            onClick={(e) => { e.preventDefault(); remove(); }}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ThreadRenameModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        thread={thread}
      />
    </div>
  );
}


