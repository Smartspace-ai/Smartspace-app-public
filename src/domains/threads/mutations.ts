
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { threadsKeys } from './queryKeys';
import { deleteThread, renameThread, setFavorite } from './service';


// Variable update mutation moved to flowruns domain

export function useSetFavorite() {
  return useMutation({
    mutationKey: threadsKeys.setFavorite(''),
    mutationFn: async ({ threadId, favorite }: { threadId: string; favorite: boolean }) => {
      await setFavorite(threadId, favorite);
    },
    onError: (error) => {
      console.error('Failed to set favorite:', error);
      toast.error('Failed to set favorite');
    },
  });
}

export function useRenameThread(threadId: string) {
  return useMutation({
    mutationKey: threadsKeys.renameThread(''),
    mutationFn: async ( name: string ) => {
      await renameThread(threadId, name);
    },
    onError: (error) => {
      console.error('Failed to rename thread:', error);
      toast.error('Failed to rename thread');
    },
  });
}

export function useDeleteThread() {
  return useMutation({
    mutationKey: threadsKeys.deleteThread(''),
    mutationFn: async ({ threadId }: { threadId: string }) => {
      await deleteThread(threadId);
    },
    onError: (error) => {
      console.error('Failed to delete thread metadata:', error);
      toast.error('Failed to delete thread');
    },
  });
}