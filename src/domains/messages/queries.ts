import { queryOptions, useQuery } from '@tanstack/react-query';

import { isDraftThreadId } from '@/shared/utils/threadId';

import type { Message } from './model';
import { messagesKeys } from './queryKeys';
import { fetchMessages } from './service';

function getPromptSignature(m: Message): string | null {
  const prompt = m.values?.find(
    (v) => v.type === 'INPUT' && v.name === 'prompt'
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
  opts?: { take?: number; skip?: number }
) {
  const isDraft = isDraftThreadId(threadId);
  return useQuery({
    ...messagesListOptions(threadId, opts),
    enabled: !!threadId && !isDraft,
    // For draft threads, we want a fast, non-loading empty state (no backend fetch).
    initialData: isDraft ? [] : undefined,
  });
}
