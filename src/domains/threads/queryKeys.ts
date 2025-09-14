export const threadsKeys = {
  all: ['threads'] as const,

  lists: () => [...threadsKeys.all, 'list'] as const,
  list: (
    workspaceId: string,
    opts?: { take?: number; skip?: number }
  ) => [...threadsKeys.lists(), { workspaceId, ...opts }] as const,

  details: () => [...threadsKeys.all, 'detail'] as const,
  detail: (workspaceId: string, threadId: string) =>
    [...threadsKeys.details(), { workspaceId, threadId }] as const,

  variables: (threadId: string) =>
    [...threadsKeys.all, 'variables', { threadId }] as const,
};


