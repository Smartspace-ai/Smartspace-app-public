// src/ui/threads/ThreadItem.vm.ts
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import type { MessageThread } from '@/domains/threads';
import { useDeleteThread, useSetFavorite } from '@/domains/threads/mutations';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

type UseThreadItemVmArgs = {
  thread: MessageThread;
  onAfterDelete?: () => void;
};

export function useThreadItemVm({ thread, onAfterDelete }: UseThreadItemVmArgs) {
  const navigate = useNavigate();
  const { workspaceId: routeWorkspaceId, threadId: routeThreadId } = useRouteIds();
  const { mutate: setFavorite, isPending: isSetFavoritePending } = useSetFavorite();
  const { mutateAsync: deleteThread } = useDeleteThread();

  const isRunning = thread.isFlowRunning;

  const goToThread = useCallback(() => {
    const wsId = thread.workSpaceId;
    if (!wsId) return;
    navigate({
      to: '/workspace/$workspaceId/thread/$threadId',
      params: { workspaceId: wsId, threadId: thread.id },
    });
  }, [navigate, thread]);

  const toggleFavorite = useCallback(() => {
    setFavorite({ threadId: thread.id, favorite: !thread.favorited });
  }, [setFavorite, thread.id, thread.favorited]);

  const remove = useCallback(async () => {
    try {
      // If we're deleting the currently-selected thread, navigate away first so we don't render
      // /thread/$threadId after its caches are removed (which can trigger the route error screen).
      if (routeThreadId && thread.id === routeThreadId) {
        const wsId = thread.workSpaceId || routeWorkspaceId;
        if (wsId) {
          navigate({ to: '/workspace/$workspaceId', params: { workspaceId: wsId }, replace: true });
        }
      }

      await deleteThread({ threadId: thread.id });
      toast.success('Thread deleted');
      onAfterDelete?.();
    } catch {
      toast.error('Failed to delete thread');
    }
  }, [deleteThread, navigate, onAfterDelete, routeThreadId, routeWorkspaceId, thread.id, thread.workSpaceId]);

  return useMemo(
    () => ({
      goToThread,
      toggleFavorite,
      remove,
      isRunning,
      isSetFavoritePending,
    }),
    [goToThread, toggleFavorite, remove, isRunning, isSetFavoritePending]
  );
}
