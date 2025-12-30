// src/ui/threads/NewThreadButton.tsx
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import type { MessageThread, ThreadsResponse } from '@/domains/threads';
import { threadsKeys } from '@/domains/threads/queryKeys';
import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { Button } from '@/shared/ui/mui-compat/button';
import { useSidebar } from '@/shared/ui/mui-compat/sidebar';
import { createDraftThreadId, isDraftThreadId, markDraftThreadId, unmarkDraftThreadId } from '@/shared/utils/threadId';

export default function NewThreadButton() {
  const { isMobile, setOpenMobileLeft } = useSidebar();
  const { workspaceId } = useRouteIds();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const handleNewThread = () => {
    if (!workspaceId || isCreating) return;
    setIsCreating(true);
    let draftId: string | null = null;

    const findExistingDraftThreadId = (): string | null => {
      const listQueries = queryClient.getQueryCache().findAll({ queryKey: threadsKeys.lists() });
      for (const q of listQueries) {
        const qk = q.queryKey as any[];
        const meta = qk?.[2];
        if (!meta || typeof meta !== 'object') continue;
        if (meta.workspaceId !== workspaceId) continue;

        const data = queryClient.getQueryData(qk) as any;
        if (!data) continue;

        // Infinite query shape: { pages: [{ data, total }, ...] }
        if (Array.isArray(data.pages)) {
          for (const page of data.pages as ThreadsResponse[]) {
            const found = page?.data?.find?.((t: MessageThread) => isDraftThreadId(t.id));
            if (found) return found.id;
          }
          continue;
        }

        // Non-infinite shape: { data, total }
        if (Array.isArray((data as ThreadsResponse).data)) {
          const found = (data as ThreadsResponse).data.find((t) => isDraftThreadId(t.id));
          if (found) return found.id;
        }
      }
      return null;
    };

    const upsertDraftIntoListCache = (draft: MessageThread) => {
      const queries = queryClient
        .getQueryCache()
        .findAll({ queryKey: threadsKeys.lists() });

      for (const q of queries) {
        const qk = q.queryKey as any[];
        const meta = qk?.[2];
        if (!meta || typeof meta !== 'object') continue;
        if (meta.workspaceId !== workspaceId) continue;

        queryClient.setQueryData(qk, (old: any) => {
          if (!old) return old;

          // Infinite query shape: { pages: [{ data, total }, ...], pageParams: [...] }
          if (Array.isArray(old.pages)) {
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
          if (Array.isArray((old as ThreadsResponse).data)) {
            const env = old as ThreadsResponse;
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
    };

    const removeDraftFromListCache = (draftId: string) => {
      const queries = queryClient
        .getQueryCache()
        .findAll({ queryKey: threadsKeys.lists() });

      for (const q of queries) {
        const qk = q.queryKey as any[];
        const meta = qk?.[2];
        if (!meta || typeof meta !== 'object') continue;
        if (meta.workspaceId !== workspaceId) continue;

        queryClient.setQueryData(qk, (old: any) => {
          if (!old) return old;

          if (Array.isArray(old.pages)) {
            const hadAny = old.pages.some((p: ThreadsResponse) => Array.isArray(p?.data) && p.data.some((t) => t.id === draftId));
            const pages = old.pages.map((p: ThreadsResponse) => {
              if (!p || !Array.isArray(p.data)) return p;
              const next = p.data.filter((t) => t.id !== draftId);
              const total =
                hadAny && typeof p.total === 'number' ? Math.max(0, p.total - 1) : p.total;
              return next.length === p.data.length
                ? { ...p, total }
                : { ...p, data: next, total };
            });
            return { ...old, pages };
          }

          if (Array.isArray((old as ThreadsResponse).data)) {
            const env = old as ThreadsResponse;
            const next = env.data.filter((t) => t.id !== draftId);
            if (next.length === env.data.length) return old;
            return {
              ...env,
              data: next,
              total: typeof env.total === 'number' ? Math.max(0, env.total - 1) : env.total,
            } satisfies ThreadsResponse;
          }

          return old;
        });
      }
    };

    try {
      // Only ever allow a single draft thread at a time.
      const existingDraftId = findExistingDraftThreadId();
      if (existingDraftId) {
        navigate({
          to: '/workspace/$workspaceId/thread/$threadId',
          params: { workspaceId, threadId: existingDraftId },
        });
        if (isMobile) setOpenMobileLeft(false);
        return;
      }

      // 1) Create a local-only draft thread so we can navigate immediately (no server round-trip).
      draftId = createDraftThreadId();
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
        workSpaceId: workspaceId,
      };

      // Prime detail + list caches so the UI can render immediately.
      queryClient.setQueryData(threadsKeys.detail(workspaceId, draftId), draftThread);
      upsertDraftIntoListCache(draftThread);

      navigate({
        to: '/workspace/$workspaceId/thread/$threadId',
        params: { workspaceId, threadId: draftId },
      });
      if (isMobile) setOpenMobileLeft(false);
    } catch (e) {
      console.error('Failed to create thread', e);
      // Best-effort rollback: if we already created a draft thread, remove it and go back to the workspace index
      // (route loader will redirect to an existing thread).
      if (draftId) {
        removeDraftFromListCache(draftId);
        unmarkDraftThreadId(draftId);
        queryClient.removeQueries({ queryKey: threadsKeys.detail(workspaceId, draftId), exact: true });
        navigate({ to: '/workspace/$workspaceId', params: { workspaceId }, replace: true });
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleNewThread}
      className="w-full gap-2 text-xs h-9"
      disabled={!workspaceId || isCreating}
    >
      <Plus className="h-3.5 w-3.5" />
      New Thread
    </Button>
  );
}
