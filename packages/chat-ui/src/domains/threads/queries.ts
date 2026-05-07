import type { QueryClient } from '@tanstack/react-query';
import {
  queryOptions,
  skipToken,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useChatService } from '@/platform/chat';
import type { ChatService } from '@/platform/chat';

import { isDraftThreadId } from '@/shared/utils/threadId';

import type { MessageThread } from './model';
import { ThreadsResponse } from './model';
import { threadsKeys } from './queryKeys';

export const threadDetailOptions = ({
  service,
  workspaceId,
  threadId,
}: {
  service: ChatService;
  workspaceId: string;
  threadId: string;
}) =>
  queryOptions({
    queryKey: threadsKeys.detail(workspaceId, threadId),
    queryFn: () => service.fetchThread(workspaceId, threadId),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

/**
 * Derive placeholder thread from list cache for instant detail display (e.g. drafts).
 * Searches all list caches for this workspace (infinite and non-infinite).
 */
export function getThreadPlaceholderFromListCache(
  queryClient: QueryClient,
  workspaceId: string,
  threadId: string
): MessageThread | undefined {
  const entries = queryClient.getQueriesData<
    ThreadsResponse | { pages: ThreadsResponse[] }
  >({
    queryKey: threadsKeys.lists(),
  });
  for (const [, data] of entries) {
    if (!data) continue;
    // Infinite query shape
    if (
      typeof data === 'object' &&
      'pages' in data &&
      Array.isArray(data.pages)
    ) {
      for (const page of data.pages) {
        const found = page?.data?.find?.((t) => t.id === threadId);
        if (found) return found;
      }
      continue;
    }
    // Non-infinite shape
    const list = data as ThreadsResponse;
    if (list?.data?.length) {
      const found = list.data.find((t) => t.id === threadId);
      if (found) return found;
    }
  }
  return undefined;
}

export const useThread = ({
  workspaceId,
  threadId,
  enabled = true,
}: {
  workspaceId: string;
  threadId: string;
  enabled?: boolean;
}) => {
  const service = useChatService();
  const queryClient = useQueryClient();
  const canFetch =
    enabled && !!workspaceId && !!threadId && !isDraftThreadId(threadId);
  const placeholderData = getThreadPlaceholderFromListCache(
    queryClient,
    workspaceId,
    threadId
  );
  return useQuery({
    ...threadDetailOptions({ service, workspaceId, threadId }),
    enabled: canFetch,
    placeholderData,
  });
};

/**
 * Unified "is this thread running?" signal for UI consumers (composer,
 * message list typing dots, sidebar dot). ORs the client-only optimistic
 * flag (set the instant the user hits send) with server-confirmed
 * `isFlowRunning` from the detail cache, so all three indicators start
 * and stop on the same render. The optimistic cell is cleared by
 * `useSendMessage` once POST returns and the detail cache holds the
 * authoritative value.
 */
export const useThreadIsRunning = (
  workspaceId: string | undefined,
  threadId: string | undefined
): boolean => {
  const queryClient = useQueryClient();

  // Subscribe to the detail cache without ever fetching. SSE/SignalR populate
  // it for the active thread via applyThreadToCache; for every other thread
  // the slot stays empty and we fall back to the list cache. Avoids the N+1
  // burst of detail GETs that fired when every sidebar ThreadItem ran its
  // own useThread.
  const { data: detailThread } = useQuery<MessageThread | undefined>({
    queryKey: threadsKeys.detail(workspaceId ?? '', threadId ?? ''),
    queryFn: skipToken,
  });

  // List cache is the authoritative source for sidebar items. Re-evaluated
  // every render — ThreadsList subscribes to the list query, so any
  // applyThreadToCache write re-renders this component with fresh data.
  const listThread =
    workspaceId && threadId
      ? getThreadPlaceholderFromListCache(queryClient, workspaceId, threadId)
      : undefined;

  const { data: optimistic } = useQuery({
    queryKey: threadsKeys.optimisticRunning(threadId ?? ''),
    queryFn: () => false,
    initialData: false,
    staleTime: Infinity,
    enabled: !!threadId,
  });

  return !!optimistic || !!(detailThread ?? listThread)?.isFlowRunning;
};
