import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageThread } from '@/models/message-thread';
import { useParams, useNavigate } from 'react-router-dom';
import {
  updateVariable,
  getThreadVariables,
  changeStatusFavorite,
  changeName,
  deleteThread,
  getThread,
} from '@/apis/threads';

export function useQueryThread(threadId?: string) {
  const threadQuery = useQuery({
    queryKey: ['thread', threadId],
    enabled: !!threadId,
    queryFn: async () => {
      if (!threadId) return Promise.reject('Thread ID is required');
      return getThread(threadId);
    },
  });

  const threadVariablesQuery = useQuery({
    queryKey: ['thread', threadId, 'variables'],
    enabled: !!threadId,
    queryFn: async () => {
      if (!threadId) return Promise.reject('Thread ID is required');
      return getThreadVariables(threadId);
    },
  });

  return { threadQuery, threadVariablesQuery };
}

export const useThreadMutations = () => {
  const queryClient = useQueryClient();
  const params = useParams();
  const navigate = useNavigate();

  const favouriteMutation = useMutation({
    mutationFn: async ({
      thread,
      favourite,
    }: {
      thread: MessageThread;
      favourite: boolean;
    }) => {
      return await changeStatusFavorite({ thread, favourite });
    },
    onSuccess: async (_data, variables) => {
      const { thread, favourite } = variables;
      queryClient.setQueryData(
        ['threads', params.workspaceId],
        (threadsData: MessageThread[]) => {
          return threadsData.map((item) =>
            item.id === thread.id
              ? { ...item, favorited: !item.favorited }
              : item
          );
        }
      );
      queryClient.invalidateQueries({
        queryKey: ['threads', params.workspaceId],
      });
      toast.success(favourite ? 'Thread favorited' : 'Thread unfavorited');
    },
    onError: (_error, variables) => {
      const { favourite } = variables;
      toast.error(
        favourite
          ? 'Thread marked as favorite unsuccessfully'
          : 'Thread unfavorited unsuccessfully'
      );
    },
  });

  const renameThreadMutation = useMutation({
    mutationFn: async ({
      thread,
      newName,
    }: {
      thread: MessageThread;
      newName: string;
    }) => {
      return await changeName({ thread, name: newName });
    },
    onSuccess: async (_data, variables) => {
      const { thread, newName } = variables;
      queryClient.setQueryData(
        ['threads', params.workspaceId],
        (threadsData: MessageThread[]) => {
          return threadsData.map((item) =>
            item.id === thread.id ? { ...item, name: newName } : item
          );
        }
      );
      queryClient.invalidateQueries({
        queryKey: ['threads', params.workspaceId],
      });
      toast.success('Thread renamed successfully');
    },
    onError: (_error, variables) => {
      toast.error('Error renaming thread');
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      return await deleteThread(threadId);
    },
    onSuccess: async (data, threadId) => {
      queryClient.setQueryData(
        ['threads', params.workspaceId],
        (threadsData: MessageThread[]) =>
          threadsData.filter((item) => item.id !== threadId)
      );
      queryClient.invalidateQueries({
        queryKey: ['threads', params.workspaceId],
      });
      if (params.threadId === threadId) {
        navigate(`/${params.workspaceId}`);
      }
      toast.success(`Deleted thread successfully`);
    },
    onError: (_error, variables) => {
      toast.error('Deleted thread unsuccessfully');
    },
  });

  const updateVariableMutation = useMutation({
    mutationFn: async ({
      variableName,
      value,
    }: {
      variableName: string;
      value: any;
    }) => {
      if (!params.threadId) return Promise.reject('Thread ID is required');
      await updateVariable(params.threadId, variableName, value);
    },
    onError: (error) => {
      console.error('Failed to update variable:', error);
      toast.error('Failed to update variable');
      throw error;
    },
  });

  return {
    favouriteMutation,
    renameThreadMutation,
    deleteThreadMutation,
    updateVariableMutation,
  };
};
