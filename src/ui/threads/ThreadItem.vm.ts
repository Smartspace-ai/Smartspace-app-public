// src/ui/threads/ThreadItem.vm.ts
import { useDeleteThread, useSetFavorite } from '@/domains/threads/mutations';
import type { MessageThread } from '@/domains/threads/schemas';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

type UseThreadItemVmArgs = {
  thread: MessageThread;
  onAfterDelete?: () => void;
};

export function useThreadItemVm({ thread, onAfterDelete }: UseThreadItemVmArgs) {
  const navigate = useNavigate();
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
      await deleteThread({ threadId: thread.id });
      toast.success('Thread deleted');
      onAfterDelete?.();
    } catch {
      toast.error('Failed to delete thread');
    }
  }, [deleteThread, onAfterDelete, thread.id]);

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
