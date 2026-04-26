export const threadUsersKeys = {
  all: ['threadUsers'] as const,

  list: (threadId: string) =>
    [...threadUsersKeys.all, 'list', { threadId }] as const,

  workspaceUsers: (workspaceId: string) =>
    [...threadUsersKeys.all, 'workspaceUsers', { workspaceId }] as const,

  mutations: () => [...threadUsersKeys.all, 'mutations'] as const,
  addUser: (threadId: string) =>
    [...threadUsersKeys.mutations(), 'addUser', { threadId }] as const,
  removeUser: (threadId: string) =>
    [...threadUsersKeys.mutations(), 'removeUser', { threadId }] as const,
};
