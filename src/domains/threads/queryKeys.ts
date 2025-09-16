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

  mutations: () => [...threadsKeys.all, 'mutations'] as const,
  updateVariable: (flowRunId: string, variableName: string) =>
    [...threadsKeys.mutations(), 'updateVariable', { flowRunId, variableName }] as const,
  setFavorite: (threadId: string) =>
    [...threadsKeys.mutations(), 'setFavorite', { threadId }] as const,
  updateThread: (threadId: string) =>
    [...threadsKeys.mutations(), 'updateThread', { threadId }] as const,
  deleteThread: (threadId: string) =>
    [...threadsKeys.mutations(), 'deleteThread', { threadId }] as const,
};


