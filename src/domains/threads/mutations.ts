
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageThread } from './schemas';
import { deleteThread, setFavorite, updateThread, updateVariable } from './service';


export function useUpdateVariable() {
  return useMutation({
    mutationFn: async ({
      flowRunId,
      variableName,
      value
    }: {
      flowRunId: string;
      variableName: string;
      value: unknown;
    }) => {
      await updateVariable(flowRunId, variableName, value);
    },
    onError: (error) => {
      console.error('Failed to update variable:', error);
      toast.error('Failed to update variable');
      throw error;
    },
  });
}

export function useSetFavorite() {
  return useMutation({
    mutationFn: async ({ threadId, favorite }: { threadId: string; favorite: boolean }) => {
      await setFavorite(threadId, favorite);
    },
    onError: (error) => {
      console.error('Failed to set favorite:', error);
      toast.error('Failed to set favorite');
    },
  });
}

export function useUpdateThread() {
  return useMutation({
    mutationFn: async ({ threadId, updates }: { threadId: string; updates: Partial<MessageThread> }) => {
      await updateThread(threadId, updates);
    },
    onError: (error) => {
      console.error('Failed to update thread:', error);
      toast.error('Failed to update thread');
    },
  });
}

export function useDeleteThread() {
  return useMutation({
    mutationFn: async ({ threadId }: { threadId: string }) => {
      await deleteThread(threadId);
    },
    onError: (error) => {
      console.error('Failed to delete thread metadata:', error);
      toast.error('Failed to delete thread');
    },
  });
}