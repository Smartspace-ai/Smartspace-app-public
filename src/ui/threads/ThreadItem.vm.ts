// src/ui/threads/ThreadItem.vm.ts
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import type { MessageThread } from '@/domains/threads';
import { useDeleteThread, useSetPin } from '@/domains/threads/mutations';

import { useSidebar } from '@/shared/ui/mui-compat/sidebar';

type UseThreadItemVmArgs = {
  thread: MessageThread;
  onAfterDelete?: () => void;
};

export function useThreadItemVm({
  thread,
  onAfterDelete,
}: UseThreadItemVmArgs) {
  const navigate = useNavigate();
  const { workspaceId: routeWorkspaceId, threadId: routeThreadId } = useRouteIds();
  const { isMobile, setOpenMobileLeft } = useSidebar();
  const { mutate: setPin, isPending: isSetPinPending } = useSetPin();
  const { mutateAsync: deleteThread } = useDeleteThread();

  const isRunning = thread.isFlowRunning;

  const goToThread = useCallback(() => {
    const wsId = thread.workSpaceId;
    if (!wsId) return;
    navigate({
      to: '/workspace/$workspaceId/thread/$threadId',
      params: { workspaceId: wsId, threadId: thread.id },
    });
    if (isMobile) setOpenMobileLeft(false);
  }, [navigate, thread, isMobile, setOpenMobileLeft]);

  const togglePin = useCallback(() => {
    setPin({ threadId: thread.id, pin: !thread.pinned });
  }, [setPin, thread.id, thread.pinned]);

  const remove = useCallback(async () => {
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
      togglePin,
      remove,
      isRunning,
      isSetPinPending,
    }),
    [goToThread, togglePin, remove, isRunning, isSetPinPending]
  );
}
