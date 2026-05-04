export const threadUsersKeys = {
  all: ['threadUsers'] as const,

  list: (threadId: string) =>
    [...threadUsersKeys.all, 'list', { threadId }] as const,

  workspaceUsers: (workspaceId: string) =>
    [...threadUsersKeys.all, 'workspaceUsers', { workspaceId }] as const,

  mutations: () => [...threadUsersKeys.all, 'mutations'] as const,
  updateUsers: (threadId: string) =>
    [...threadUsersKeys.mutations(), 'updateUsers', { threadId }] as const,
};
