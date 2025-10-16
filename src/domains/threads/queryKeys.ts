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

  mutations: () => [...threadsKeys.all, 'mutations'] as const,
  setFavorite: (threadId: string) =>
    [...threadsKeys.mutations(), 'setFavorite', { threadId }] as const,
  renameThread: (threadId: string) =>
    [...threadsKeys.mutations(), 'renameThread', { threadId }] as const,
  deleteThread: (threadId: string) =>
    [...threadsKeys.mutations(), 'deleteThread', { threadId }] as const,
};
