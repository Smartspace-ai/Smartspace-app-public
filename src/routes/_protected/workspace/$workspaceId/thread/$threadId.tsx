import { createFileRoute } from "@tanstack/react-router";

import { queryClient } from '@/platform/reactQueryClient';

import type { MessageThread, ThreadsResponse } from '@/domains/threads';
import { threadDetailOptions } from '@/domains/threads/queries';
import { threadsKeys } from '@/domains/threads/queryKeys';


import ChatBotPage from "@/pages/WorkspaceThreadPage/chat";
import { RouteIdsProvider } from "@/pages/WorkspaceThreadPage/RouteIdsProvider";

import { isDraftThreadId, markDraftThreadId } from '@/shared/utils/threadId';

type ThreadsListMeta = { workspaceId?: string };
type ThreadsListKey = readonly unknown[];

function isThreadsListMeta(x: unknown): x is ThreadsListMeta {
  return !!x && typeof x === 'object' && ('workspaceId' in x);
}

function isThreadsResponse(x: unknown): x is ThreadsResponse {
  if (!x || typeof x !== 'object') return false;
  const obj = x as Record<string, unknown>;
  return Array.isArray(obj.data);
}

function isInfiniteThreadsResponse(x: unknown): x is { pages: ThreadsResponse[]; pageParams?: unknown[] } {
  if (!x || typeof x !== 'object') return false;
  const obj = x as Record<string, unknown>;
  return Array.isArray(obj.pages);
}

function upsertDraftIntoListCache(workspaceId: string, draft: MessageThread) {
  const queries = queryClient.getQueryCache().findAll({ queryKey: threadsKeys.lists() });

  for (const q of queries) {
    const qk = q.queryKey as ThreadsListKey;
    const meta = qk?.[2];
    if (!isThreadsListMeta(meta)) continue;
    if (meta.workspaceId !== workspaceId) continue;

    queryClient.setQueryData(qk, (old: unknown) => {
      if (!old) return old;

      // Infinite query shape: { pages: [{ data, total }, ...], pageParams: [...] }
      if (isInfiniteThreadsResponse(old)) {
        const pages = old.pages.slice();
        if (!pages[0] || !Array.isArray(pages[0].data)) return old;

        const first = pages[0];
        const already = first.data.some((t: MessageThread) => t.id === draft.id);
        if (already) return old;

        pages[0] = { ...first, data: [draft, ...first.data] };
        for (let i = 0; i < pages.length; i++) {
          const p = pages[i];
          if (!p || typeof p.total !== 'number') continue;
          pages[i] = { ...p, total: p.total + 1 };
        }
        return { ...old, pages };
      }

      // Non-infinite shape: { data, total }
      if (isThreadsResponse(old)) {
        const env = old;
        const already = env.data.some((t) => t.id === draft.id);
        if (already) return old;
        return {
          ...env,
          data: [draft, ...env.data],
          total: typeof env.total === 'number' ? env.total + 1 : env.total,
        } satisfies ThreadsResponse;
      }

      return old;
    });
  }
}

// routes/_protected/workspace/$workspaceId/thread/$threadId.tsx
export const Route = createFileRoute('/_protected/workspace/$workspaceId/thread/$threadId')({
  pendingMs: 0,
  pendingComponent: () => (
    <RouteIdsProvider>
      <ChatBotPage />
    </RouteIdsProvider>
  ),
  loader: async ({ params }) => {
    // Draft threads are client-side only until a message is sent (or creation succeeds in background).
    // Avoid fetching thread details for draft ids (backend will 404).
    if (isDraftThreadId(params.threadId)) return null;

    try {
      return await queryClient.ensureQueryData(
        threadDetailOptions({ workspaceId: params.workspaceId, threadId: params.threadId })
      );
    } catch (e: unknown) {
      // If user deep-links to a random GUID that doesn't exist yet, treat it as a draft thread id.
      const err = (e && typeof e === 'object') ? (e as Record<string, unknown>) : null;
      if (err?.type !== 'NotFound') throw e;

      const draftId = params.threadId;
      markDraftThreadId(draftId);

      const now = new Date();
      const draftThread: MessageThread = {
        id: draftId,
        name: 'New Thread',
        createdAt: now,
        createdBy: 'me',
        createdByUserId: '',
        isFlowRunning: false,
        lastUpdated: 'Just now',
        lastUpdatedAt: now,
        lastUpdatedByUserId: '',
        totalMessages: 0,
        favorited: false,
        avatarName: null,
        workSpaceId: params.workspaceId,
      };

      // Prime caches so UI can render immediately without any backend fetches.
      queryClient.setQueryData(threadsKeys.detail(params.workspaceId, draftId), draftThread);
      upsertDraftIntoListCache(params.workspaceId, draftThread);
      return null;
    }
  },
  component: () => (
    <RouteIdsProvider>
      <ChatBotPage />
    </RouteIdsProvider>
  ),
});
