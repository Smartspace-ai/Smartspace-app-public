import { queryOptions, useQuery } from '@tanstack/react-query';

import { isDraftThreadId } from '@/shared/utils/threadId';

import type { ThreadUser } from './model';
import { threadUsersKeys } from './queryKeys';
import { fetchThreadUsers } from './service';

export const threadUsersListOptions = (threadId: string) =>
  queryOptions<ThreadUser[]>({
    queryKey: threadUsersKeys.list(threadId),
    queryFn: () => fetchThreadUsers(threadId),
    refetchOnWindowFocus: false,
  });

export const useThreadUsers = (threadId: string | null | undefined) => {
  const enabled = !!threadId && !isDraftThreadId(threadId);
  return useQuery({
    ...threadUsersListOptions(threadId ?? ''),
    enabled,
    initialData: enabled ? undefined : [],
  });
};
