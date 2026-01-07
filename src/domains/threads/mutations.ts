
import type { InfiniteData } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { MessageThread, ThreadsResponse } from './model';
import { threadsKeys } from './queryKeys';
import { deleteThread, renameThread, setFavorite } from './service';


// Variable update mutation moved to flowruns domain

function isThreadsResponse(x: unknown): x is ThreadsResponse {
  if (!x || typeof x !== 'object') return false;
  const obj = x as Record<string, unknown>;
  return Array.isArray(obj.data);
}

function isInfiniteThreadsResponse(x: unknown): x is InfiniteData<ThreadsResponse> {
  if (!x || typeof x !== 'object') return false;
  const obj = x as Record<string, unknown>;
  return Array.isArray(obj.pages);
}

function isMessageThread(x: unknown): x is MessageThread {
  if (!x || typeof x !== 'object') return false;
  const obj = x as Record<string, unknown>;
  return typeof obj.id === 'string';
}

export function useSetFavorite() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: threadsKeys.setFavorite(''),
    mutationFn: async ({ threadId, favorite }: { threadId: string; favorite: boolean }) => {
      await setFavorite(threadId, favorite);
    },
    onMutate: async (variables) => {
      // Ensure "favorited" state updates instantly in any cached thread list/detail views
      // and then we will refetch lists to stay consistent with server sorting/filters.
      await qc.cancelQueries({ queryKey: threadsKeys.lists() });
      await qc.cancelQueries({ queryKey: threadsKeys.details() });

      const previousLists = qc.getQueriesData({ queryKey: threadsKeys.lists() });
      const previousDetails = qc.getQueriesData({ queryKey: threadsKeys.details() });

      const patchThread = (t: MessageThread) =>
        t.id === variables.threadId ? { ...t, favorited: variables.favorite } : t;

      qc.setQueriesData({ queryKey: threadsKeys.lists() }, (old) => {
        if (!old) return old;

        // Non-infinite list shape: { data, total }
        if (isThreadsResponse(old)) {
          const res = old;
          return { ...res, data: res.data.map(patchThread) };
        }

        // Infinite list shape: { pages: [{data,total}, ...], pageParams: [...] }
        if (isInfiniteThreadsResponse(old)) {
          const inf = old;
          return {
            ...inf,
            pages: inf.pages.map((page) => ({ ...page, data: page.data.map(patchThread) })),
          };
        }

        return old;
      });

      qc.setQueriesData({ queryKey: threadsKeys.details() }, (old) => {
        if (!old) return old;
        if (isMessageThread(old)) return patchThread(old);
        return old;
      });

      return { previousLists, previousDetails };
    },
    onError: (error, _variables, ctx) => {
      // Roll back optimistic updates
      if (ctx?.previousLists) {
        for (const [key, data] of ctx.previousLists) {
          qc.setQueryData(key, data);
        }
      }
      if (ctx?.previousDetails) {
        for (const [key, data] of ctx.previousDetails) {
          qc.setQueryData(key, data);
        }
      }
      console.error('Failed to set favorite:', error);
      toast.error('Failed to set favorite');
    },
    onSettled: async () => {
      // Reload lists so server-side ordering/filters reflect the new favorite state.
      await qc.invalidateQueries({ queryKey: threadsKeys.lists() });
      await qc.invalidateQueries({ queryKey: threadsKeys.details() });
    },
  });
}

export function useRenameThread(threadId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: threadsKeys.renameThread(threadId),
    mutationFn: async (name: string) => {
      await renameThread(threadId, name);
    },
    onMutate: async (name) => {
      await qc.cancelQueries({ queryKey: threadsKeys.lists() });
      await qc.cancelQueries({ queryKey: threadsKeys.details() });

      const previousLists = qc.getQueriesData({ queryKey: threadsKeys.lists() });
      const previousDetails = qc.getQueriesData({ queryKey: threadsKeys.details() });

      const patchThread = (t: MessageThread) => (t.id === threadId ? { ...t, name } : t);

      qc.setQueriesData({ queryKey: threadsKeys.lists() }, (old) => {
        if (!old) return old;

        if (isThreadsResponse(old)) {
          const res = old;
          return { ...res, data: res.data.map(patchThread) };
        }

        if (isInfiniteThreadsResponse(old)) {
          const inf = old;
          return { ...inf, pages: inf.pages.map((p) => ({ ...p, data: p.data.map(patchThread) })) };
        }

        return old;
      });

      qc.setQueriesData({ queryKey: threadsKeys.details() }, (old) => {
        if (!old) return old;
        if (isMessageThread(old)) return patchThread(old);
        return old;
      });

      return { previousLists, previousDetails };
    },
    onError: (error, _name, ctx) => {
      if (ctx?.previousLists) {
        for (const [key, data] of ctx.previousLists) qc.setQueryData(key, data);
      }
      if (ctx?.previousDetails) {
        for (const [key, data] of ctx.previousDetails) qc.setQueryData(key, data);
      }
      console.error('Failed to rename thread:', error);
      toast.error('Failed to rename thread');
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: threadsKeys.lists() });
      await qc.invalidateQueries({ queryKey: threadsKeys.details() });
    },
  });
}

export function useDeleteThread() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: threadsKeys.deleteThread(''),
    mutationFn: async ({ threadId }: { threadId: string }) => {
      await deleteThread(threadId);
    },
    onMutate: async ({ threadId }) => {
      await qc.cancelQueries({ queryKey: threadsKeys.lists() });
      await qc.cancelQueries({ queryKey: threadsKeys.details() });

      const previousLists = qc.getQueriesData({ queryKey: threadsKeys.lists() });
      const previousDetails = qc.getQueriesData({ queryKey: threadsKeys.details() });

      qc.setQueriesData({ queryKey: threadsKeys.lists() }, (old) => {
        if (!old) return old;

        const removeThread = (t: MessageThread) => t.id !== threadId;

        if (isThreadsResponse(old)) {
          const res = old;
          const next = res.data.filter(removeThread);
          if (next.length === res.data.length) return old;
          return { ...res, data: next, total: typeof res.total === 'number' ? Math.max(0, res.total - 1) : res.total };
        }

        if (isInfiniteThreadsResponse(old)) {
          const inf = old;
          const hadAny = inf.pages.some((p) => p.data.some((t) => t.id === threadId));
          if (!hadAny) return old;
          const pages = inf.pages.map((p) => {
            const next = p.data.filter(removeThread);
            const total = typeof p.total === 'number' ? Math.max(0, p.total - 1) : p.total;
            return next.length === p.data.length ? { ...p, total } : { ...p, data: next, total };
          });
          return { ...inf, pages };
        }

        return old;
      });

      // Remove cached details for this thread id (any workspace)
      for (const [key] of previousDetails) {
        const meta = key?.[2];
        const metaObj = meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : null;
        if (typeof metaObj?.threadId === 'string' && metaObj.threadId === threadId) {
          qc.removeQueries({ queryKey: key, exact: true });
        }
      }

      return { previousLists, previousDetails };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previousLists) {
        for (const [key, data] of ctx.previousLists) qc.setQueryData(key, data);
      }
      if (ctx?.previousDetails) {
        for (const [key, data] of ctx.previousDetails) qc.setQueryData(key, data);
      }
      console.error('Failed to delete thread metadata:', error);
      toast.error('Failed to delete thread');
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: threadsKeys.lists() });
      await qc.invalidateQueries({ queryKey: threadsKeys.details() });
    },
  });
}