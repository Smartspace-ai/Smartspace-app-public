// src/ui/threads/ThreadsList.tsx
import { AlertTriangle, MessageSquare, Search } from 'lucide-react';
import { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { Skeleton } from '@/shared/ui/mui-compat/skeleton';

import { useWorkspace } from '@smartspace/chat-ui';

import ThreadItem from './ThreadItem';
import { useThreadsListVm } from './ThreadsList.vm';

function ThreadsLoadingSkeleton() {
  return (
    <div className="px-3">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="px-3 py-3.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

function EmptyThreadsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center h-full">
      <div className="rounded-full bg-secondary p-3 mb-3">
        <MessageSquare className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        No threads found
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Create a new thread to get started
      </p>
    </div>
  );
}

function ThreadsErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center h-full px-4">
      <div className="rounded-full bg-destructive/10 p-3 mb-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        Failed to load threads
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Please check your connection and try again.
      </p>
    </div>
  );
}

function ThreadsInlineErrorBanner() {
  return (
    <div className="px-3 pt-1 pb-2">
      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs font-medium">Failed to refresh threads</span>
      </div>
    </div>
  );
}

// ThreadsList.tsx
export default function ThreadsList() {
  const { workspaceId } = useRouteIds();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: activeWorkspace } = useWorkspace(workspaceId);
  const {
    threads,
    total,
    isInitialLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useThreadsListVm({ workspaceId, pageSize: 30 });

  const hasError = !!(isError || error);

  const subtitle = isInitialLoading
    ? 'Loading threads…'
    : `${total} ${total === 1 ? 'thread' : 'threads'}${
        activeWorkspace?.name ? ` in ${activeWorkspace.name}` : ''
      }`;

  const body = isInitialLoading ? (
    <ThreadsLoadingSkeleton />
  ) : hasError && !threads.length ? (
    <ThreadsErrorState />
  ) : !threads.length ? (
    <EmptyThreadsState />
  ) : (
    <Virtuoso
      data={threads}
      overscan={200}
      endReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      components={{
        Header: () => (hasError ? <ThreadsInlineErrorBanner /> : null),
      }}
      itemContent={(index, thread) => (
        <div className="px-3">
          <ThreadItem thread={thread} />
        </div>
      )}
      style={{ height: '100%', width: '100%' }}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Presentational only — placed to match the reference design. It holds
          its own text but is not wired to any filtering yet. */}
      <div className="px-5 pb-3">
        <div className="group relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search threads..."
            aria-label="Search threads"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="px-5 pb-2">
        <h2 className="text-xl font-bold text-foreground">Threads</h2>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {subtitle}
        </p>
      </div>
      <div className="min-h-0 flex-1">{body}</div>
    </div>
  );
}
