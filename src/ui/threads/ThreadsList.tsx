// src/ui/threads/ThreadsPanel.tsx
import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';
import { Button } from '@/shared/ui/shadcn/button';
import { SidebarContent, SidebarFooter, useSidebar } from '@/shared/ui/shadcn/sidebar';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';
import { useMatch, useNavigate } from '@tanstack/react-router';
import { MessageSquare } from 'lucide-react';
import { useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import ThreadItem from './ThreadItem';
import { useThreadsListVm } from './ThreadsList.vm';

function ThreadsLoadingSkeleton() {
  return (
    <>
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="p-2.5">
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
      <h3 className="text-sm font-medium text-gray-900 mb-1">No threads found</h3>
      <p className="text-xs text-gray-500 mb-4">Create a new thread to get started</p>
    </div>
  );
}

export default function ThreadsPanel() {
  const { isMobile, setOpenMobileLeft } = useSidebar();
  const { workspaceId } = useRouteIds();
  const navigate = useNavigate();

  const { threads, isInitialLoading, hasNextPage, isFetchingNextPage, fetchNextPage, firstThread } =
    useThreadsListVm({ pageSize: 30 });

  // Auto-select first thread if no threadId in URL
  const threadMatch = useMatch({ from: '/_protected/workspace/$workspaceId/thread/$threadId', shouldThrow: false });
  const urlThreadId = threadMatch?.params?.threadId;

  useEffect(() => {
    if (!isInitialLoading && !urlThreadId && firstThread) {
      const wsId = firstThread.workSpaceId ?? workspaceId;
      if (!wsId) return;
      navigate({
        to: '/workspace/$workspaceId/thread/$threadId',
        params: { workspaceId: wsId, threadId: firstThread.id },
        replace: true,
      });
    }
  }, [isInitialLoading, urlThreadId, firstThread, workspaceId, navigate]);

  const onNewThread = () => {
    const id = crypto.randomUUID();
    const wsId = workspaceId ?? firstThread?.workSpaceId;
    if (!wsId) return;
    navigate({ to: '/workspace/$workspaceId/thread/$threadId', params: { workspaceId: wsId, threadId: id } });
    if (isMobile) setOpenMobileLeft(false);
  };

  return (
    <>
      <SidebarContent className="px-0 py-0 overflow-auto h-full">
        <div className="sticky top-0 z-10 border-t border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-xs text-gray-500 font-medium tracking-wide">Threads</h2>
          </div>
        </div>

        {isInitialLoading ? (
          <ThreadsLoadingSkeleton />
        ) : !threads.length ? (
          <EmptyThreadsState />
        ) : (
          <Virtuoso
            data={threads}
            overscan={200}
            endReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            itemContent={(index, thread) => (
              <div className="px-3 pb-1">
                <ThreadItem thread={thread} />
              </div>
            )}
            className="pt-2"
            style={{ height: '100%', width: '100%' }}
            components={{
              Footer: () =>
                isFetchingNextPage ? (
                  <div className="p-4 text-xs text-gray-500">Loading more…</div>
                ) : null,
            }}
          />
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4 mt-auto sticky bottom-0 ">
        <Button onClick={onNewThread} className="w-full gap-2 text-xs h-9">
          New Thread
        </Button>
      </SidebarFooter>
    </>
  );
}
