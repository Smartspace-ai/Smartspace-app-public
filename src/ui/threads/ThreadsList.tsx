// src/ui/threads/ThreadsList.tsx
import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';
import { MessageSquare } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import ThreadItem from './ThreadItem';
import { useThreadsListVm } from './ThreadsList.vm';

function ThreadsLoadingSkeleton() {
  return (
    <>
      {Array(5)
        .fill(0)
        .map((_, i) => (
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

// ThreadsList.tsx
export default function ThreadsList() {
    const { workspaceId } = useRouteIds();
  const { threads, isInitialLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useThreadsListVm({ workspaceId, pageSize: 30 });

  if (isInitialLoading) return <ThreadsLoadingSkeleton />;
  if (!threads.length) return <EmptyThreadsState />;

  return (
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
    />
  );
}
  