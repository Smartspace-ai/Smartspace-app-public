import { useMatch, useNavigate } from '@tanstack/react-router';
import {
  Edit,
  Loader2 // Add Loader2 for spinner
  ,











  MessageSquare,
  MoreHorizontal,
  Plus,
  Star,
  Trash2
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/shadcn/alert-dialog';
import { Button } from '@/shared/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/shared/ui/shadcn/dropdown-menu';
import { SidebarContent, SidebarFooter, useSidebar } from '@/shared/ui/shadcn/sidebar';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';

import { CircleInitials } from '@/components/circle-initials';
import { useDeleteThread, useSetFavorite, useUpdateThread } from '@/domains/threads/mutations';
import { useInfiniteThreads } from '@/domains/threads/queries';
import { MessageThread } from '@/domains/threads/schemas';
import { renameThread } from '@/domains/threads/service';
import { Virtuoso } from 'react-virtuoso';
import { ThreadRenameModal } from './thread-rename-modal/thread-rename-modal';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

export function Threads() {  
  const { isMobile, setOpenMobileLeft } = useSidebar();
  const {workspaceId} = useRouteIds();
 const {data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage} = useInfiniteThreads(workspaceId);
  const threads = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);

  const [hoveredThreadId, setHoveredThreadId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const navigate = useNavigate();
  const threadMatch = useMatch({ from: '/_protected/workspace/$workspaceId/thread/$threadId', shouldThrow: false });
  const workspaceMatch = useMatch({ from: '/_protected/workspace/$workspaceId', shouldThrow: false });
  const urlWorkspaceId = threadMatch?.params?.workspaceId ?? workspaceMatch?.params?.workspaceId;
  const threadId = threadMatch?.params?.threadId;

  // Removed unused thread fetch to avoid extra renders and warnings

  const handleThreadClick = (thread: MessageThread) => {
    const workspaceIdToUse = thread.workSpaceId ?? urlWorkspaceId;
    if (!workspaceIdToUse) return;
    navigate({
      to: '/workspace/$workspaceId/thread/$threadId',
      params: { workspaceId: workspaceIdToUse, threadId: thread.id },
    });
    if (isMobile) {
      setOpenMobileLeft(false);
    }
  };

  const [autoCreatedThreadId, setAutoCreatedThreadId] = useState<string | null>(null);

  const handleNewThread = () => {
    const newThreadId = crypto.randomUUID();

    // might need to set isNew search param
    const targetWorkspaceId = urlWorkspaceId ?? threads?.[0]?.workSpaceId;
    if (!targetWorkspaceId) return;
    navigate({
      to: '/workspace/$workspaceId/thread/$threadId',
      params: { workspaceId: targetWorkspaceId, threadId: newThreadId },
    });
    if (isMobile) {
      setOpenMobileLeft(false);
    }
  }



  useEffect(() => {
    if (!isLoading && !threadId && threads.length === 0) {
      const newThreadId = crypto.randomUUID();
      setAutoCreatedThreadId(newThreadId);
      
      if (urlWorkspaceId) {
        navigate({
          to: '/workspace/$workspaceId/thread/$threadId',
          params: { workspaceId: urlWorkspaceId, threadId: newThreadId },
        });
      }
      return;
    }

    if (threads.length > 0 && (!threadId || (autoCreatedThreadId && threadId === autoCreatedThreadId))) {
      const firstThread = threads[0];
      const workspaceIdToUse = firstThread.workSpaceId ?? urlWorkspaceId;
      if (workspaceIdToUse) {
        navigate({
          to: '/workspace/$workspaceId/thread/$threadId',
          params: { workspaceId: workspaceIdToUse, threadId: firstThread.id },
        });
      }
      return;
    }
  }, [
    threads,
    isLoading,
    threadId,
    autoCreatedThreadId,
    urlWorkspaceId,
    navigate,
  ]);

  return (
    <>
      <SidebarContent className="px-0 py-0 overflow-auto h-full">
        <div className="sticky top-0 z-10 border-t border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-xs text-gray-500 font-medium tracking-wide">
              Threads
            </h2>
          </div>
        </div>

        <SidebarContent className="p-0">
          {isLoading ? (
            <ThreadsLoadingSkeleton />
          ) : threads.length > 0 ? (
            <Virtuoso
              data={threads}
              overscan={200}
              endReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              itemContent={(index, thread) => (
                <div className="px-3 pb-1">
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={threadId === thread.id}
                    hoveredThreadId={hoveredThreadId}
                    openMenuId={openMenuId}
                    onThreadClick={handleThreadClick}
                    onHover={setHoveredThreadId}
                    onMenuOpenChange={setOpenMenuId}
                  />
                </div>
              )}
              className="pt-2"
              style={{ height: '100%', width: '100%' }}
              components={{
                Footer: () =>
                  isFetchingNextPage ? (
                    <div className="p-4 text-xs text-gray-500">Loading more...</div>
                  ) : null,
              }}
            />
          ) : (
            <EmptyThreadsState />
          )}
        </SidebarContent>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 mt-auto sticky bottom-0 ">
        <Button onClick={handleNewThread} className="w-full gap-2 text-xs h-9">
          <Plus className="h-3.5 w-3.5" />
          New Thread
        </Button>
      </SidebarFooter>
    </>
  );
}


function ThreadsLoadingSkeleton() {
  return (
    <>
      {Array(5)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="p-2.5">
            <div className="flex items-start gap-2.5">
              <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
    </>
  );
}

function EmptyThreadsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center h-full">
      <div className="rounded-full bg-gray-100 p-3 mb-3">
        <MessageSquare className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">
        No threads found
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Create a new thread to get started
      </p>
    </div>
  );
}

type ThreadItemProps = {
  thread: MessageThread;
  isActive: boolean;
  hoveredThreadId: string | null;
  openMenuId: string | null;
  onThreadClick: (thread: MessageThread) => void;
  onHover: (id: string | null) => void;
  onMenuOpenChange: (id: string | null) => void;
};

function ThreadItem({
  thread,
  isActive,
  hoveredThreadId,
  openMenuId,
  onThreadClick,
  onHover,
  onMenuOpenChange,
}: ThreadItemProps) {
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newThreadName, setNewThreadName] = useState(thread.name);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { mutate: setFavoriteMutation, isPending: isSetFavoritePending } = useSetFavorite()
  const { mutate: updateThreadMutation } = useUpdateThread()
  const { mutate: deleteThreadMutation } = useDeleteThread()

  const handlePointerDown = (e: React.PointerEvent) => {
    if (
      e.target instanceof Element &&
      (e.target.closest('button') || e.target.closest('[role="menuitem"]'))
    ) {
      return;
    }
    onThreadClick(thread);
  };

  const handleRenameSubmit = async () => {
    if (newThreadName.trim()) {
      try {
        onMenuOpenChange(null);
        await renameThread(thread, newThreadName);
        updateThreadMutation({ threadId: thread.id, updates: { name: newThreadName } });
        setIsRenameModalOpen(false);
        toast.success('Thread renamed successfully');
      } catch (error) {
        console.error('Error renaming thread:', error);
        toast.error('Failed to rename thread. Please try again.');
      }
    }
  };

  const handleDeleteThreadItem = async () => {
    try {
      onMenuOpenChange(null);
      deleteThreadMutation({ threadId: thread.id });
      setIsDeleteDialogOpen(false);
      toast.success('Thread deleted successfully');
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Failed to delete thread. Please try again.');
    }
  };

  return (
    <div
      id={`thread-${thread.id}`}
      className={`group relative flex items-start gap-2.5 p-2.5 hover:bg-accent cursor-pointer transition-all rounded-lg ${
        isActive ? 'bg-accent shadow-sm' : ''
      }`}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => onHover(thread.id)}
      onMouseLeave={() => {
        if (hoveredThreadId === thread.id && openMenuId !== thread.id) {
          onHover(null);
        }
      }}
    >
      <CircleInitials
        className={isActive ? 'bg-primary/80 text-[hsl(var(--primary-foreground))]' : 'bg-gray-200'}
        text={thread.name}
      />

      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-medium truncate">{thread.name}</h3>
        <div className="text-[11px] gap-x-2 mt-0.5 flex flex-row">
          <div>
            {thread.totalMessages}{' '}
            {thread.totalMessages === 1 ? 'message' : 'messages'}  {' '}
          </div>

          {thread.isFlowRunning ? (
            <div className="text-amber-500 font-medium flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin" /> 
              <p className='text-xs'>Running…</p>
            </div>
          ) : (
            <div>
              {thread.lastUpdated}
            </div>
          )}

          <div className='flex-grow'></div>
          {isSetFavoritePending  && !thread.isFlowRunning  ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          ) :
            thread.favorited && (
              <div className="text-amber-500 font-medium">
                <Star className="h-4 w-4" /> 
              </div>
            )
          }
       
        </div>
      </div>

      <ThreadItemMenu
        thread={thread}
        isActive={isActive}
        isHovered={hoveredThreadId === thread.id}
        isMenuOpen={openMenuId === thread.id}
        onMenuOpenChange={(open) => onMenuOpenChange(open ? thread.id : null)}
        onFavorite={() => setFavoriteMutation({ threadId: thread.id, favorite: !thread.favorited })}
        onRename={() => setIsRenameModalOpen(true)}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />

      <ThreadRenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        threadName={newThreadName}
        setThreadName={setNewThreadName}
        onSubmit={handleRenameSubmit}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{thread.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-5">
            <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteThreadItem}
              className="bg-red-500 hover:bg-red-600 text-white text-sm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type ThreadItemMenuProps = {
  thread: MessageThread;
  isActive: boolean;
  isHovered: boolean;
  isMenuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onFavorite: () => void;
  onRename: () => void;
  onDelete: () => void;
};

function ThreadItemMenu({
  thread,
  isActive,
  isHovered,
  isMenuOpen,
  onMenuOpenChange,
  onFavorite,
  onRename,
  onDelete,
}: ThreadItemMenuProps) {
  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={onMenuOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 absolute right-1.5 top-1.5 p-0 rounded-full opacity-100 z-10 ${
            isActive
              ? 'text-gray-500 hover:bg-gray-200'
              : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
          }`}
          
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
            onFavorite();
            onMenuOpenChange(false);
          }}
        >
          <Star className="mr-2 h-3.5 w-3.5 text-amber-400" />
          <span>
            {thread.favorited ? 'Remove from favorites' : 'Add to favorites'}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs py-1.5 px-2 rounded-md"
          onClick={(e) => {
            e.preventDefault();
            onRename();
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
            onDelete();
          }}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default Threads;
