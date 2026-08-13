// src/ui/threads/ThreadsList.tsx
import { AlertTriangle, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { Skeleton } from '@/shared/ui/mui-compat/skeleton';

import { useWorkspace } from '@smartspace/chat-ui';

import ThreadItem from './ThreadItem';
import { useThreadsListVm } from './ThreadsList.vm';

function ThreadsLoadingSkeleton() {
  return (
    <div className="px-3">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="mb-0.5 flex items-center gap-2.5 px-3 py-2">
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="mb-1.5 h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
    </div>
  );
}

function ThreadsEmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{message}</p>
  );
}

function ThreadsErrorState() {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <AlertTriangle className="mb-3 h-6 w-6 text-destructive" />
      <p className="text-sm font-medium text-foreground">
        Failed to load threads
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Please check your connection and try again.
      </p>
    </div>
  );
}

function ThreadsInlineErrorBanner() {
  return (
    <div className="px-3 pb-2">
      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="truncate text-xs font-medium">
          Failed to refresh threads
        </span>
      </div>
    </div>
  );
}

export default function ThreadsList() {
  const { workspaceId } = useRouteIds();
  const [searchQuery, setSearchQuery] = useState('');
  // Search runs server-side (the endpoint filters name/id and returns the
  // filtered total), so results aren't limited to the pages already loaded.
  // Debounced 300ms to avoid a request per keystroke, same as the model
  // picker's search.
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
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
  } = useThreadsListVm({
    workspaceId,
    pageSize: 30,
    search: debouncedQuery,
  });

  const hasError = !!(isError || error);

  const isSearching = searchQuery.trim().length > 0;
  const count = total;

  const body = isInitialLoading ? (
    <ThreadsLoadingSkeleton />
  ) : hasError && !threads.length ? (
    <ThreadsErrorState />
  ) : !threads.length ? (
    <ThreadsEmptyState
      message={isSearching ? 'No threads found' : 'No threads yet'}
    />
  ) : (
    <Virtuoso
      data={threads}
      overscan={200}
      endReached={() => {
        // Search is server-side, so results paginate like the full list.
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      components={{
        Header: () => (hasError ? <ThreadsInlineErrorBanner /> : null),
      }}
      itemContent={(_index, thread) => (
        <div className="px-3">
          <ThreadItem thread={thread} />
        </div>
      )}
      style={{ height: '100%', width: '100%' }}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Search */}
      <div className="px-5 pb-3">
        <div className="group relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads…"
            aria-label="Search threads"
            className="w-full rounded-lg border border-border bg-transparent py-2 pl-9 pr-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Heading */}
      <div className="flex items-baseline justify-between gap-2 px-5 pb-2">
        <h2 className="chat-sidebar-heading shrink-0">Threads</h2>
        <p className="chat-sidebar-subheading min-w-0 truncate">
          {isInitialLoading
            ? 'Loading…'
            : `${count}${
                activeWorkspace?.name ? ` in ${activeWorkspace.name}` : ''
              }`}
        </p>
      </div>

      <div className="min-h-0 flex-1">{body}</div>
    </div>
  );
}
