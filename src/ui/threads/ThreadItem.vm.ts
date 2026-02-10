// src/ui/threads/ThreadItem.vm.ts
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';


import type { MessageThread } from '@/domains/threads';
import { useDeleteThread, useSetFavorite } from '@/domains/threads/mutations';
import { threadDetailOptions } from '@/domains/threads/queries';

import { NEW_THREAD_ID } from '@/shared/utils/threadId';

type UseThreadItemVmArgs = {
  thread: MessageThread;
  onAfterDelete?: () => void;
};

export function useThreadItemVm({
  thread,
  onAfterDelete,
}: UseThreadItemVmArgs) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspaceId: routeWorkspaceId, threadId: routeThreadId } =
    useRouteIds();
  const { mutate: setFavorite, isPending: isSetFavoritePending } =
    useSetFavorite();
  const { mutateAsync: deleteThread } = useDeleteThread();

  const isNewThreadRow = thread.id === NEW_THREAD_ID;
  const isRunning = thread.isFlowRunning;

  const prefetchThreadDetail = useCallback(() => {
    if (isNewThreadRow) return;
    const wsId = thread.workSpaceId;
    if (!wsId) return;
    queryClient.prefetchQuery(
      threadDetailOptions({ workspaceId: wsId, threadId: thread.id })
    );
  }, [isNewThreadRow, queryClient, thread.workSpaceId, thread.id]);

  const prefetchThreadDetailDebounced = useMemo(
    () => debounce(prefetchThreadDetail, 200),
    [prefetchThreadDetail]
  );

  useEffect(() => {
    return () => {
      prefetchThreadDetailDebounced.cancel();
    };
  }, [prefetchThreadDetailDebounced]);

  const goToThread = useCallback(() => {
    const wsId = thread.workSpaceId;
    if (!wsId) return;
    if (isNewThreadRow) {
      navigate({
        to: '/workspace/$workspaceId/thread/new',
        params: { workspaceId: wsId },
      });
      return;
    }
    navigate({
      to: '/workspace/$workspaceId/thread/$threadId',
      params: { workspaceId: wsId, threadId: thread.id },
    });
  }, [navigate, thread, isNewThreadRow]);

  const toggleFavorite = useCallback(() => {
    if (isNewThreadRow) return;
    setFavorite({ threadId: thread.id, favorite: !thread.favorited });
  }, [isNewThreadRow, setFavorite, thread.id, thread.favorited]);

  const remove = useCallback(async () => {
    if (isNewThreadRow) return;
    try {
      // If we're deleting the currently-selected thread, navigate away first so we don't render
      // /thread/$threadId after its caches are removed (which can trigger the route error screen).
      if (routeThreadId && thread.id === routeThreadId) {
        const wsId = thread.workSpaceId || routeWorkspaceId;
        if (wsId) {
          navigate({
            to: '/workspace/$workspaceId',
            params: { workspaceId: wsId },
            replace: true,
          });
        }
      }

      await deleteThread({ threadId: thread.id });
      toast.success('Thread deleted');
      onAfterDelete?.();
    } catch {
      toast.error('Failed to delete thread');
    }
  }, [
    deleteThread,
    isNewThreadRow,
    navigate,
    onAfterDelete,
    routeThreadId,
    routeWorkspaceId,
    thread.id,
    thread.workSpaceId,
  ]);

  return useMemo(
    () => ({
      goToThread,
      toggleFavorite,
      remove,
      isRunning,
      isSetFavoritePending,
      prefetchThreadDetail,
      prefetchThreadDetailDebounced,
    }),
    [
      goToThread,
      toggleFavorite,
      remove,
      isRunning,
      isSetFavoritePending,
      prefetchThreadDetail,
      prefetchThreadDetailDebounced,
    ]
  );
}
