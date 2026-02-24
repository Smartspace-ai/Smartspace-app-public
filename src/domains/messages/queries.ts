import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';

import { isDraftThreadId } from '@/shared/utils/threadId';

import { MessageValueType } from './enums';
import type { Message } from './model';
import { messagesKeys } from './queryKeys';
import { fetchMessages } from './service';

function getPromptSignature(m: Message): string | null {
  const prompt = m.values?.find(
    (v) => v.type === MessageValueType.INPUT && v.name === 'prompt'
  );
  if (!prompt) return null;
  try {
    return JSON.stringify(prompt.value ?? null);
  } catch {
    return null;
  }
}

function mergeFetchedWithOptimistics(
  current: Message[] | undefined,
  fetched: Message[]
): Message[] {
  if (!current?.length) return fetched;

  // Only preserve optimistic/pending client messages; server-fetched is source of truth for non-optimistic.
  const optimistics = current.filter((m) => m.optimistic);
  if (!optimistics.length) return fetched;

  // If the server already returned a matching prompt message, drop the optimistic to avoid duplicates.
  const fetchedPromptSigs = new Set(
    fetched
      .map((m) => getPromptSignature(m))
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
  );

  const dedupedOptimistics = optimistics.filter((o) => {
    const sig = getPromptSignature(o);
    if (!sig) return true;
    return !fetchedPromptSigs.has(sig);
  });

  return [...fetched, ...dedupedOptimistics];
}

export const messagesListOptions = (
  threadId: string,
  opts?: { take?: number; skip?: number }
) =>
  queryOptions<Message[]>({
    queryKey: threadId ? messagesKeys.list(threadId) : messagesKeys.lists(),
    // NOTE: queryKey intentionally does NOT include opts. This keeps cache updates from
    // message mutations (which write to messagesKeys.list(threadId)) working.
    // If opts changes (e.g. user clicks "Load full history"), we manually refetch.
    queryFn: async (ctx) => {
      if (!threadId) return [];
      const fetched = (await fetchMessages(threadId, opts)).reverse();
      // IMPORTANT: read cache AFTER fetch so we merge with latest (e.g. optimistic send).
      const current = ctx.client.getQueryData<Message[]>(
        messagesKeys.list(threadId)
      );
      return mergeFetchedWithOptimistics(current, fetched);
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Avoid re-fetching the entire thread on every small navigation.
    staleTime: 30_000,
  });

export function useMessages(
  threadId: string,
  opts?: { take?: number; skip?: number; skipWhenNewThread?: boolean }
) {
  const isDraft = isDraftThreadId(threadId);
  const skipFetch = opts?.skipWhenNewThread || !threadId || isDraft;
  const listOpts =
    opts?.take != null || opts?.skip != null
      ? { take: opts.take, skip: opts.skip }
      : undefined;
  return useQuery({
    ...messagesListOptions(threadId, listOpts),
    enabled: !opts?.skipWhenNewThread && !!threadId && !isDraft,
    initialData: skipFetch ? [] : undefined,
  });
}

const DEFAULT_MESSAGES_PAGE_SIZE = 50;

/**
 * Infinite query options for loading older messages (offset-based).
 * Page 0 = most recent; fetchPreviousPage loads older (page 1, 2, ...).
 */
export function messagesInfiniteOptions(
  threadId: string,
  pageSize = DEFAULT_MESSAGES_PAGE_SIZE
) {
  return infiniteQueryOptions({
    queryKey: messagesKeys.infinite(threadId),
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const fetched = await fetchMessages(threadId, {
        take: pageSize,
        skip: pageParam * pageSize,
      });
      return fetched.reverse();
    },
    initialPageParam: 0,
    getNextPageParam: () => undefined,
    getPreviousPageParam: (
      firstPage: Message[],
      _allPages: Message[][],
      firstPageParam: number
    ) => (firstPage.length < pageSize ? undefined : firstPageParam + 1),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
  });
}

/**
 * Hook for infinite messages (load older via fetchPreviousPage).
 * Flattens pages so oldest is first; use for prepend/scroll-to-top UX.
 */
export function useInfiniteMessages(
  threadId: string,
  pageSize = DEFAULT_MESSAGES_PAGE_SIZE,
  opts?: { skipWhenNewThread?: boolean }
) {
  const isDraft = isDraftThreadId(threadId);
  return useInfiniteQuery({
    ...messagesInfiniteOptions(threadId, pageSize),
    enabled: !opts?.skipWhenNewThread && !!threadId && !isDraft,
  });
}
